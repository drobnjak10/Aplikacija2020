import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseConfiguration } from '../config/database.configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Administrator } from 'entities/administrator.entity';
import { AdministratorService } from './services/administrator/administrator.service';
import { Article } from 'entities/article.entity';
import { ArticlePrice } from 'entities/article-price.entity';
import { ArticleFeature } from 'entities/article-feature.entity';
import { Cart } from 'entities/cart.entity';
import { CartArticle } from 'entities/cart-article.entity';
import { Category } from 'entities/category.entity';
import { Feature } from 'entities/feature.entity';
import { Order } from 'entities/order.entity';
import { Photo } from 'entities/photo.entity';
import { User } from 'entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: DatabaseConfiguration.hostname,
      port: 3306,
      username: DatabaseConfiguration.username,
      password: DatabaseConfiguration.password,
      database: DatabaseConfiguration.database,
      entities: [ 
        Administrator,
        Article,
        ArticlePrice,
        ArticleFeature,
        Cart,
        CartArticle,
        Category,
        Feature,
        Order,
        Photo,
        User
      ]
    }),
    TypeOrmModule.forFeature([ Administrator ])
  ],
  controllers: [AppController],
  providers: [AdministratorService],
})
export class AppModule {}
