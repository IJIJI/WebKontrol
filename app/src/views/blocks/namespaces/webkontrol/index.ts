import { blockTypeRegistry } from "../../registry";
import { ContainerBlockTypeDefinition, DateTimeBlockTypeDefinition, FreeFormBlockTypeDefinition, GridBlockTypeDefinition, TextBlockTypeDefinition, WebsiteBlockTypeDefinition } from "./blocks.schema";


for ( const typeDef of [WebsiteBlockTypeDefinition, TextBlockTypeDefinition, ContainerBlockTypeDefinition, GridBlockTypeDefinition, FreeFormBlockTypeDefinition, DateTimeBlockTypeDefinition]) {
  blockTypeRegistry.register(typeDef);
}