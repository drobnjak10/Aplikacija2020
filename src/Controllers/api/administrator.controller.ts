import { Body, Controller, Get, Param, Patch, Post, Put, SetMetadata, UseGuards } from "@nestjs/common";
import { AdministratorService } from "src/services/administrator/administrator.service";
import { Administrator } from 'src/entities/administrator.entity';
import { AddAdministratorDto } from "src/dtos/administrator/add.administrator.dto";
import { EditAdministratorDto } from "src/dtos/administrator/edit.administrator.dto";
import { ApiResponse } from "src/misc/api.response.class";
import { AllowToRoles } from "src/misc/allow.to.roles.descriptor";
import { RoleCheckerGuard } from "src/misc/role.checker.guard";


@Controller('api/administrator')
export class AdministratorController {
    constructor(
        private administratorService: AdministratorService
    ) { }

    @Get()
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles("administrator")
    // @SetMetadata('allow_to_roles', ['administrator'])
    // @AllowToRoles('administrator')
    getAll(): Promise<Administrator[]> {
        return this.administratorService.getAll();
    }

    @Get(':id')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator')
    getById( @Param('id') id: number): Promise<Administrator | ApiResponse> {
        return new Promise(async(resolve) => {
            let admin: Administrator = await this.administratorService.getById(id);

            if(admin === undefined) {
                resolve(new ApiResponse("error", -1002));
            }

            resolve(admin);

        })
    }

    @Post()
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles("administrator")
    add(@Body() data: AddAdministratorDto): Promise<Administrator | ApiResponse> {
        return this.administratorService.add(data);
    } 

    @Patch(':id')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles("administrator")
    edit(@Param('id') id: number, @Body() data: EditAdministratorDto): Promise<Administrator | ApiResponse> {
        return this.administratorService.editById(id, data);
    }

}