import { Body, Controller, Param, Post, Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Crud } from "@nestjsx/crud";
import { Article } from "entities/article.entity";
import { AddArticleDto } from "src/dtos/article/add.article.dto";
import { ArticleService } from "src/services/article/article.service";
import { diskStorage } from "multer";
import { storageConfig } from "config/storage.config";
import { PhotoService } from "src/services/photo/photo.service";
import { Photo } from "entities/photo.entity";
import { ApiResponse } from "src/misc/api.response.class";

@Controller('api/article')
@Crud({
    model:{
        type: Article
    },
    params: {
        id: {
            field: "articleId",
            type: "number",
            primary: true
        }
    },
    query: {
        join: {
            category: {
                eager: true
            },
            photos: {
                eager: true
            },
            articlePrices: {
                eager: true
            },
            articleFeatures: {
                eager: true
            },
            features: {
                eager: true
            }
        }
    }
})
export class ArticleController {
    constructor(
        public service: ArticleService,
        public photoService: PhotoService
    ) {}

    @Post('createFull')
    createFullArticle(@Body() data: AddArticleDto) {
        return this.service.createFullArticle(data);
    }

    @Post(':id/uploadPhoto')
    @UseInterceptors(
        FileInterceptor('photo', {
            storage: diskStorage({
                destination: storageConfig.photoDestination,
                filename: (req, file, callback) => {
                    let original: string = file.originalname;
                    let normalized = original.replace(/\s+/g, '-');
                    normalized.replace(/[^[A-z0-9\.\-]/g, '');
                    let sada = new Date();
                    let datePart = '';
                     datePart += sada.getFullYear().toString();
                     datePart += (sada.getMonth() + 1).toString();
                     datePart += sada.getDate().toString();

                    let randomPart: string = new Array(10).fill(0).map(el => (Math.random()*10).toFixed(0).toString()).join('');

                    let filename = datePart + '-' + randomPart + '-' + normalized;
                    filename = filename.toLowerCase();

                    callback(null, filename);
                }
            }),
            fileFilter: (req, file, callback) => {
                // 1. check file extension JPEG, PNG
                if(!file.originalname.toLowerCase().match(/\.(jpg|png)$/)) {
                    req.fileFilterError = 'Bad File Extension!';
                    callback(null, false);
                    return;
                }
                // 2. check tipa sadrzaja image/jpeg image/png
                if(!(file.mimetype.includes('jpeg') || file.mimetype.includes('png'))) {
                    req.fileFilterError = 'Bad File Content!';
                    callback(null, false);
                    return;
                }

                callback(null, true);
            },
            limits: {
                files: 1,
                fileSize: storageConfig.photoMaxFileSize
            }
        })
    )
    async uploadPhoto(@Param('id') articleId: number, @UploadedFile() photo, @Req() req): Promise<Photo | ApiResponse> {
        if(req.fileFilterError) {
            return new ApiResponse('error', -4002, req.fileFilterError);
        }

        if(!photo) {
            return new ApiResponse('error', -4002, 'Photo not uploaded!');
        }

        let imagePath = photo.filename // zapis u bazu

        const newPhoto = new Photo();
        newPhoto.articleId = articleId;
        newPhoto.imagePath = imagePath;

        const savedPhoto = await this.photoService.add(newPhoto);

        if(!savedPhoto) {
            return new ApiResponse('error', -4001);
        }
        
        return savedPhoto;
    }
    
    
}