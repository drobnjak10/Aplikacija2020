import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { type } from "os";
import { AddArticleDto } from "src/dtos/article/add.article.dto";
import { ArticleSearchDto } from "src/dtos/article/article.search.dto";
import { EditArticleDto } from "src/dtos/article/edit.article.dto";
import { ArticleFeature } from "src/entities/article-feature.entity";
import { ArticlePrice } from "src/entities/article-price.entity";
import { Article } from "src/entities/article.entity";
import { ApiResponse } from "src/misc/api.response.class";
import { In, Repository } from "typeorm";

@Injectable()
export class ArticleService extends TypeOrmCrudService<Article>{
    constructor(
        @InjectRepository(Article)
        private readonly article: Repository<Article>,
        @InjectRepository(ArticlePrice)
        private readonly articlePrice: Repository<ArticlePrice>,
        @InjectRepository(ArticleFeature)
        private readonly articleFeature: Repository<ArticleFeature>
    ) {
        super(article);
    }

    async createFullArticle(data: AddArticleDto): Promise<Article | ApiResponse> {
        let newArticle: Article = new Article();
        newArticle.name = data.name;
        newArticle.categoryId = data.categoryId;
        newArticle.excpert = data.excerpt;
        newArticle.description = data.description;

        let savedArticle = await this.article.save(newArticle);
        
        // price, features

        let newArticlePrice: ArticlePrice = new ArticlePrice();
        newArticlePrice.articleId = savedArticle.articleId;
        newArticlePrice.price = data.price;

        await this.articlePrice.save(newArticlePrice);
        
        for (let feature of data.features) {
            let newArticleFeature: ArticleFeature = new ArticleFeature();
            newArticleFeature.articleId = savedArticle.articleId;
            newArticleFeature.featureId = feature.featureId;
            newArticleFeature.value = feature.value;

            await this.articleFeature.save(newArticleFeature);
        } 
        
        return await this.article.findOne(savedArticle.articleId, {
            relations: [
                "category",
                "articleFeatures",
                "features",
                "articlePrices"
            ]
        })
        
    }

    async editFullArticle(  articleId: number, data: EditArticleDto ): Promise<Article | ApiResponse> {
        const existingArticle: Article = await this.article.findOne(articleId, {
            relations: [ 'articlePrices', 'articleFeatures' ]
        });

        if(!existingArticle) {
            return new ApiResponse('error', -5001, 'Article not found!');
        }

        existingArticle.name = data.name;
        existingArticle.categoryId = data.categoryId;
        existingArticle.excpert = data.excerpt;
        existingArticle.description = data.description;
        existingArticle.status = data.status;
        existingArticle.isPromoted = data.isPromoted;

        const savedArticle = await this.article.save(existingArticle);
        if(!savedArticle) {
            return new ApiResponse('error', -5002, 'Could not saved new article data!');
        }

        let newPriceString: string = Number(data.price).toFixed(2); // string

        // let newPrice = data.price;
        let lastPrice = existingArticle.articlePrices[existingArticle.articlePrices.length - 1].price;

        let lastPriceString: string = Number(lastPrice).toFixed(2); // string
        
        if(newPriceString !== lastPriceString) {
            const newArticlePrice = new ArticlePrice();
            newArticlePrice.articleId = savedArticle.articleId;
            newArticlePrice.price = data.price;

            const savedArticlePrice = await this.articlePrice.save(newArticlePrice);

            if(!savedArticlePrice) {
                return new ApiResponse('error', -5003, 'Cannot save new article price!');
            }
        }
        
        if(data.features !== null) {
           await this.articleFeature.remove(existingArticle.articleFeatures);

           for (let feature of data.features) {
                let newArticleFeature: ArticleFeature = new ArticleFeature();
                newArticleFeature.articleId = articleId;
                newArticleFeature.featureId = feature.featureId;
                newArticleFeature.value = feature.value;

                await this.articleFeature.save(newArticleFeature);
            } 
        }

        return await this.article.findOne(articleId, {
            relations: [
                "category",
                "articleFeatures",
                "features",
                "articlePrices"
            ]
        });

    }

    async search(data: ArticleSearchDto): Promise<Article[]> {
        const builder = await this.article.createQueryBuilder("article");

        builder.innerJoinAndSelect("article.articlePrices", "aPrice", 
                            "aPrice.createdAt = (SELECT MAX(aPrice.created_at) FROM article_price AS aPrice WHERE aPrice.article_id = article.article_id)"); // aPrice alias
        builder.leftJoinAndSelect("article.articleFeatures", "aFeature");

        builder.where("article.categoryId = :categoryId", { categoryId: data.categoryId });

        if(data.keywords && data.keywords.length > 0) {
            builder.andWhere(`(article.name LIKE :keyword OR 
                               article.excerpt LIKE :keyword OR 
                               article.description LIKE :keyword)`, 
                                { keyword: '%' + data.keywords.trim() + '%'}); // LIKE = bilo sta
        }

        if(data.priceMin && typeof data.priceMin === 'number') {
            builder.andWhere("aPrice.price >= :min", { min: data.priceMin });
        }

        if(data.priceMax && typeof data.priceMax === 'number') {
            builder.andWhere("aPrice.price <= :max", { max: data.priceMax });
        }

        if(data.features && data.features.length > 0) {
            for(const feature of data.features) {
                builder.andWhere("aFeature.featureId = :featureId AND aFeature.value IN(:fValues)", 
                { featureId: feature.featureId, fValues: feature.values })
            }
        }

        let orderBy = 'article.name';
        let orderDirection: 'ASC' | 'DESC' = 'ASC';

        if(data.orderBy) {
            orderBy = data.orderBy;

            if(orderBy === 'price') {
                orderBy = 'aPrice.price'; 
            }

            if(orderBy === 'name') {
                orderBy = 'article.name'; 
            }
        }

        if(data.orderDirection) {
            orderDirection = data.orderDirection;
        }

        builder.orderBy(orderBy, orderDirection);
        
        let page = 0;
        let perPage: 5 | 10 | 25 | 50 | 75 = 25;
        
        if(data.page && typeof data.page === 'number') {
            page = data.page;
        }

        if(data.itemsPerPage && typeof data.itemsPerPage === 'number') {
            perPage = data.itemsPerPage;
        }
        
        builder.skip(page * perPage);
        builder.take(perPage);

        let itemIds = await (await builder.getMany()).map(article => { article.articleId });

        return await this.article.find({
            where: { articleId: In(itemIds) },
            relations: [
                "category",
                "articleFeatures",
                "features",
                "articlePrices"
            ]
        });
        
     }
}