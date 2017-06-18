import { ReplacerOptions } from "./options"
import { SingleReplacer } from "./singleReplacer"
import { VinylReplacer } from "./vinylReplacer"

export interface Factory {
  (options: ReplacerOptions): SingleReplacer | VinylReplacer,
  SingleReplacer: any
  VinylReplacer: any
}

const factory = ((options) => {
  if (options && options.single) {
    return new SingleReplacer(options)
  } else {
    return new VinylReplacer(options)
  }
}) as Factory

factory.SingleReplacer = SingleReplacer
factory.VinylReplacer = VinylReplacer
export default factory
export { ReplacerOptions }
