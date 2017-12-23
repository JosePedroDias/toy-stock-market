declare type CorsFn = ({
  origin: boolean | RegExp | Array<string | RegExp> | Function | string,
  optionsSuccessStatus: number
}) => any;

declare module "cors" {
  declare module.exports: {
    (): CorsFn
  };
}
