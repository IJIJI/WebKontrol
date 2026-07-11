import { blockTypeRegistry } from "../../registry";
import {
  ContainerBlock,
  DateTimeBlock,
  FreeFormBlock,
  GridBlock,
  ns,
  TextBlock,
  WebsiteBlock,
} from "./blocks.schema";

ns.register(blockTypeRegistry, [
  WebsiteBlock,
  TextBlock,
  ContainerBlock,
  GridBlock,
  FreeFormBlock,
  DateTimeBlock,
]);
