export default interface IAction {
  execute(...args: unknown[]): unknown;
}
