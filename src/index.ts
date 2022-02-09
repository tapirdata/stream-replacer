import { ReplacerOptions } from './options';
import { SingleReplacer } from './singleReplacer';
import { VinylReplacer } from './vinylReplacer';

export interface Factory {
  (options: ReplacerOptions): SingleReplacer | VinylReplacer;
}

const factory: Factory = (options: ReplacerOptions) => {
  if (options && options.single) {
    return new SingleReplacer(options);
  } else {
    return new VinylReplacer(options);
  }
};

export default factory;
export { ReplacerOptions, SingleReplacer, VinylReplacer };
