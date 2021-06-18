import { Body, Controller, Delete, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Crud } from "@nestjsx/crud";
import { Article } from "src/entities/article.entity";
import { AddArticleDto } from "src/dtos/article/add.article.dto";
import { ArticleService } from "src/services/article/article.service";
import { diskStorage } from "multer";
import { StorageConfig } from "config/storage.config";
import { PhotoService } from "src/services/photo/photo.service";
import { Photo } from "src/entities/photo.entity";
import { ApiResponse } from "src/misc/api.response.class";
import * as filetype from "file-type";
import * as fs from "fs";
import * as sharp from "sharp";
import { EditArticleDto } from "src/dtos/article/edit.article.dto";
import { RoleCheckerGuard } from "src/misc/role.checker.guard";
import { AllowToRoles } from "src/misc/allow.to.roles.descriptor";
import { ArticleSearchDto } from "src/dtos/article/article.search.dto";

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
    },
    routes: {
        only: [
            'getOneBase', 
            'getManyBase'
        ],
        getOneBase: {
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator', 'user')
            ]
        },
        getManyBase: {
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator', 'user')
            ]
        }
    }
})
export class ArticleController {
    constructor(
        public service: ArticleService,
        public photoService: PhotoService
    ) {}

    
    @Post('create')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles("administrator")
    createFullArticle(@Body() data: AddArticleDto) {
        return this.service.createFullArticle(data);
    }

    @Patch(':id')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles("administrator")
    editFullArticle(@Param('id') id: number, @Body() data: EditArticleDto) {
        return this.service.editFullArticle(id, data);
    }

    @Post(':id/uploadPhoto')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles("administrator")
    @UseInterceptors(
        FileInterceptor('photo', {
            storage: diskStorage({
                destination: StorageConfig.photo.destination,
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
                fileSize: StorageConfig.photo.maxSize
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

        // check MimeType

        const fileTypeResult = await filetype.fromFile(photo.path);
        if(!fileTypeResult) {
            // Delete file
            fs.unlinkSync(photo.path);
            return new ApiResponse('error', -4002, 'Cannot detect file type!');
        }

        const realMimeType = fileTypeResult.mime;
        if(!(realMimeType.includes('jpeg') || realMimeType.includes('png'))) {
            // Delete file
            fs.unlinkSync(photo.path);
            return new ApiResponse('error', -4002, 'Bad file content!');
        }
        ``

        // check Saved a resize file
     
        // await this.createThumb(photo);
        // await this.createSmallImage(photo);
        await this.createResizedImage(photo, StorageConfig.photo.resize.thumb)
        await this.createResizedImage(photo, StorageConfig.photo.resize.small)

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
    
    async createThumb(photo) {
        return this.createSmallImage(StorageConfig.photo.resize.thumb);
    }

    async createSmallImage(photo) {
        return this.createSmallImage(StorageConfig.photo.resize.small);
    }
    
    async createResizedImage(photo, resizeSettings) {
        const originalFilePath = photo.path;
        const fileName = photo.filename;

        const destinationFilePath = StorageConfig.photo.destination + resizeSettings.directory + fileName;

        await sharp(originalFilePath)
            .resize({
                fit: 'cover',
                width: resizeSettings.width,
                height: resizeSettings.height

            })
            .toFile(destinationFilePath);
    }

    @Delete(':articleId/deletePhoto/:photoId') // http://localhost:3000/api/article/1/deletePhoto/3
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles("administrator")
    async deletePhoto( @Param('articleId') articleId: number, @Param('photoId') photoId: number ) {
        const photo = await this.photoService.findOne({
            articleId: articleId,
            photoId: photoId
        });

        if(!photo) {
            return new ApiResponse('error', -4004, 'Photo not found!');
        };


        try {
            fs.unlinkSync(StorageConfig.photo.destination + photo.imagePath);
            fs.unlinkSync(StorageConfig.photo.destination + StorageConfig.photo.resize.thumb.directory + photo.imagePath);
            fs.unlinkSync(StorageConfig.photo.destination + StorageConfig.photo.resize.small.directory + photo.imagePath);
        } catch(e) {}
       
        
        const deleteResult = await this.photoService.deleteById(photo.photoId);
        
        if(deleteResult.affected === null) {
            return new ApiResponse('error', -4004, 'Photo not found!');
        }

        return new ApiResponse('ok', 0, 'One photo deleted!');
        
    }

    @Post('search')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator', 'user')
    async search(@Body() data: ArticleSearchDto): Promise<Article[]> {
        return await this.service.search(data);
    }
    
}