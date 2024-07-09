import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOAuth2, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'nest-keycloak-connect';
import { Metadata } from './dto/metadata.dto';
import { MetadataService } from './metadata.service';
import { CredentialIssuerMetadataOptsV1_0_13 } from '@sphereon/oid4vci-common';

@ApiTags('metadata')
@UseGuards(AuthGuard)
@ApiOAuth2([])
@Controller('metadata')
export class MetadataController {
  constructor(private metadataService: MetadataService) {}

  /**
   * Get the metadata for the credential issuer.
   * @returns
   */
  @ApiOperation({ summary: 'Get the metadata for the credential issuer' })
  @Get()
  getMetadata() {
    //these are only the metadata values the user can change, it's not the whole metadata that are returned via the .well-known endpoint
    return this.metadataService.getMetadata() as Metadata;
  }

  @ApiOperation({ summary: 'Set the metadata for the credential issuer' })
  @Post()
  setMetadata(@Body() metadata: Metadata) {
    //we only want some specific values to be set, so we can not implement the whole interface
    return this.metadataService.setMetadata(
      metadata as CredentialIssuerMetadataOptsV1_0_13
    );
  }
}
