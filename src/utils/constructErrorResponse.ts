export default function constructErrorResponse(err: Error, additions: object) {
  return {
    ...additions,
    stack: err.stack,
  };
}
