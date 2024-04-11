import { Model } from "@croquet/croquet";

export class ReactModel extends Model {
  __reactEvents: { scope: string; event: string }[] = [];

  init(options: any) {
    super.init(options);
    this.__reactEvents = [];
  }

  subscribe<T>(
    scope: string,
    event: string,
    methodName: string | ((e: T) => void)
  ): void {
    this.__reactEvents.push({ scope, event });

    if (typeof methodName === "function") {
      methodName = methodName.name;
    }

    // This is a hacky (and maybe dubious) way to add
    // custom logic before and after the Model handler
    // is called. Since closures cannot be serialized, we
    // need to convert `hack` to a String, replace the lost
    // values with literals (obtained at runtime) and then
    // convert that string into a function again.
    // That function will be used by a (yet) undocumented
    // feature of Croquet that allows you to pass a function
    // instead of a method.

    function hack(data: any) {
      // @ts-ignore
      this.methodName(data);
      // @ts-ignore
      this.publish(this.id, "react-updated");
    }

    const hackString = hack
      .toString()
      //
      // replace methodName by the actual method name
      .replace("methodName", methodName)
      //
      // extract only the function body
      .replace(/^[^{]+\{/, "")
      .replace(/\}[^}]*$/, "");

    // this function will receive a single argument: data
    const func = new Function("data", hackString) as (e: unknown) => void;

    super.subscribe(scope, event, func);
  }
}
ReactModel.register("ReactModel");
