import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { DatabaseConfiguration } from '../config/database.configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministratorService } from './services/administrator/administrator.service';
import { Article } from 'src/entities/article.entity';
import { ArticlePrice } from 'src/entities/article-price.entity';
import { ArticleFeature } from 'src/entities/article-feature.entity';
import { Cart } from 'src/entities/cart.entity';
import { CartArticle } from 'src/entities/cart-article.entity';
import { Category } from 'src/entities/category.entity';
import { Feature } from 'src/entities/feature.entity';
import { Order } from 'src/entities/order.entity';
import { Photo } from 'src/entities/photo.entity';
import { User } from 'src/entities/user.entity';
import { Administrator } from 'src/entities/administrator.entity';
import { AdministratorController } from './controllers/api/administrator.controller';
import { CategoryService } from './services/category/category.service';
import { CategoryController } from './controllers/api/category.controller';
import { ArticleService } from './services/article/article.service';
import { ArticleController } from './controllers/api/article.controller';
import { AuthController } from './controllers/api/auth.controller';
import { AuthMiddleware } from './middlwares/auth.middleware';
import { PhotoService } from './services/photo/photo.service';
import { FeatureService } from './services/feature/feature.service';
import { FeatureController } from './controllers/api/feature.controller';
import { UserService } from './services/user/user.service';
import { CartService } from './services/cart/cart.service';
import { UserCartController } from './controllers/api/user.cart.controller';

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
    TypeOrmModule.forFeature([ Administrator, Category, Article, ArticlePrice, ArticleFeature, Photo, Feature, User, Cart, Order, CartArticle ])
  ],
  controllers: [AppController, AdministratorController, CategoryController, ArticleController, AuthController, FeatureController, UserCartController],
  providers: [AdministratorService, CategoryService, ArticleService, PhotoService, FeatureService, UserService, CartService],
  exports: [AdministratorService, UserService]

})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware)
            .exclude('auth/*')
            .forRoutes('api/*');
  }
}
