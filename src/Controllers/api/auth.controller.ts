import { Body, Controller, Post, Put, Req,  } from "@nestjs/common";
import { AddAdministratorDto } from "src/dtos/administrator/add.administrator.dto";
import { LoginAdministratorDto } from "src/dtos/administrator/login.administrator.dto";
import { ApiResponse } from "src/misc/api.response.class";
import { AdministratorService } from "src/services/administrator/administrator.service";
import * as crypto from "crypto";
import { LoginInfoDto } from "src/dtos/auth/login.info.dto";
import * as jwt from "jsonwebtoken";
import { JwtDataDto } from "src/dtos/auth/jwt.data.dto";
import { Request } from "express";
import { jwtSecret } from "config/jwtSecret";
import { UserRegistrationDto } from "src/dtos/user/user.registration.dto";
import { UserService } from "src/services/user/user.service";
import { LoginUserDto } from "src/dtos/user/login.user.dto";

@Controller('auth')
export class AuthController {
    constructor(public administratorService: AdministratorService, public userService: UserService) {}

    @Post('administrator/login') //localhost:3000/auth/administrator/login
    async doAdministratorLogin(@Body() data: LoginAdministratorDto, @Req() req: Request): Promise<LoginInfoDto | ApiResponse> {
        const administrator = await this.administratorService.getByUsername(data.username);

        if(!administrator) {
            return new Promise(resolve => resolve(new ApiResponse("error", -3001)));
        }

        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(data.password);
        const passwordHashString = passwordHash.digest('hex').toUpperCase();

        if(administrator.passwordHash !== passwordHashString) {
            return new Promise(resolve => resolve(new ApiResponse("error", -3002)));
        }

        // TOKEN = JSON [adminId, username, exp, ip, ua]
        const jwtData = new JwtDataDto();
        jwtData.role = "administrator";
        jwtData.id = administrator.administratorId;
        jwtData.identity = administrator.username;

        let sada = new Date();
        sada.setDate(sada.getDate() + 14);
        const istekTimeStamp = sada.getTime() / 1000;

        jwtData.exp = istekTimeStamp;
        jwtData.ip = req.ip;
        jwtData.ua = req.headers["user-agent"];
        

        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret); // gen

        const responseObject = new LoginInfoDto(
            administrator.administratorId,
            administrator.username,
            token
        );

        return new Promise(resolve => resolve(responseObject));
        
        // administratorId
        // username
        // token (JWT)
    }

    @Put('user/register') // PUT http://localhost:3000/user/register
    async userRegister(@Body() data: UserRegistrationDto) {
        return this.userService.register(data);
    }

    @Post('user/login') //localhost:3000/auth/administrator/login
    async doUserLogin(@Body() data: LoginUserDto, @Req() req: Request): Promise<LoginInfoDto | ApiResponse> {
        const user = await this.userService.getByEmail(data.email);

        if(!user) {
            return new Promise(resolve => resolve(new ApiResponse("error", -3001)));
        }

        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(data.password);
        const passwordHashString = passwordHash.digest('hex').toUpperCase();

        if(user.passwordHash !== passwordHashString) {
            return new Promise(resolve => resolve(new ApiResponse("error", -3002)));
        }

        // TOKEN = JSON [adminId, username, exp, ip, ua]
        const jwtData = new JwtDataDto();
        jwtData.role = "user";
        jwtData.id = user.userId;
        jwtData.identity = user.email;

        let sada = new Date();
        sada.setDate(sada.getDate() + 14);
        const istekTimeStamp = sada.getTime() / 1000;

        jwtData.exp = istekTimeStamp;
        jwtData.ip = req.ip;
        jwtData.ua = req.headers["user-agent"];
        

        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret); // gen

        const responseObject = new LoginInfoDto(
            user.userId,
            user.email,
            token
        );

        return new Promise(resolve => resolve(responseObject));
        
        // administratorId
        // username
        // token (JWT)
    }
}