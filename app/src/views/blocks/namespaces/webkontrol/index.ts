import { blockTypeRegistry } from "../../registry";
import { ContainerBlockType, DateTimeBlockType, FreeFormBlockType, GridBlockType, TextBlockType, WebsiteBlockType } from "./blocks.schema";


for ( const typeDef of [new WebsiteBlockType(), new TextBlockType(), new ContainerBlockType(), new GridBlockType(), new FreeFormBlockType(), new DateTimeBlockType()]) {
  blockTypeRegistry.register(typeDef);
}