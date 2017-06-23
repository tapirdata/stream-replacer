import { ReplacerOptions } from "./options"
import { SingleReplacer } from "./singleReplacer"
import { VinylReplacer } from "./vinylReplacer"

export interface Factory {
  (options: ReplacerOptions): SingleReplacer | VinylReplacer,
  SingleReplacer: typeof SingleReplacer
  VinylReplacer: typeof VinylReplacer
}

const factory = ((options) => {
  if (options && options.single) {
    return new SingleReplacer(options)
  } else {
    return new VinylReplacer(options)
  }
}) as Factory

factory.SingleReplacer = SingleReplacer // legaxy
factory.VinylReplacer = VinylReplacer // legaxy
export default factory
export { ReplacerOptions, SingleReplacer, VinylReplacer }
