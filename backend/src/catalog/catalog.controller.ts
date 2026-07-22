import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller()
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Get('roles')
  roles() {
    return this.service.getRoles();
  }

  @Get('customers')
  customers() {
    return this.service.getCustomers();
  }

  @Get('dispositions')
  dispositions() {
    return this.service.getDispositions();
  }

  @Get('agent-availabilities')
  availabilities() {
    return this.service.getAvailabilities();
  }
}
