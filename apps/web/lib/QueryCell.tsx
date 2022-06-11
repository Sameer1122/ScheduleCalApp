import {
  QueryObserverIdleResult,
  QueryObserverLoadingErrorResult,
  QueryObserverLoadingResult,
  QueryObserverRefetchErrorResult,
  QueryObserverSuccessResult,
  UseQueryResult,
} from "react-query";

import { Alert } from "@calcom/ui/Alert";

import { trpc } from "@lib/trpc";

import Loader from "@components/Loader";

import type { AppRouter } from "@server/routers/_app";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { UseTRPCQueryOptions } from "@trpc/react";
// import type { inferProcedures } from "@trpc/react/src/createReactQueryHooks";
import type {
  inferHandlerInput,
  inferProcedureInput,
  inferProcedureOutput,
  ProcedureRecord,
} from "@trpc/server";

type ErrorLike = {
  message: string;
};
type JSXElementOrNull = JSX.Element | null;

interface QueryCellOptionsBase<TData, TError extends ErrorLike> {
  query: UseQueryResult<TData, TError>;
  error?: (
    query: QueryObserverLoadingErrorResult<TData, TError> | QueryObserverRefetchErrorResult<TData, TError>
  ) => JSXElementOrNull;
  loading?: (query: QueryObserverLoadingResult<TData, TError>) => JSXElementOrNull;
  idle?: (query: QueryObserverIdleResult<TData, TError>) => JSXElementOrNull;
}

interface QueryCellOptionsNoEmpty<TData, TError extends ErrorLike>
  extends QueryCellOptionsBase<TData, TError> {
  success: (query: QueryObserverSuccessResult<TData, TError>) => JSXElementOrNull;
}

interface QueryCellOptionsWithEmpty<TData, TError extends ErrorLike>
  extends QueryCellOptionsBase<TData, TError> {
  success: (query: QueryObserverSuccessResult<NonNullable<TData>, TError>) => JSXElementOrNull;
  /**
   * If there's no data (`null`, `undefined`, or `[]`), render this component
   */
  empty: (query: QueryObserverSuccessResult<TData, TError>) => JSXElementOrNull;
}

export function QueryCell<TData, TError extends ErrorLike>(
  opts: QueryCellOptionsWithEmpty<TData, TError>
): JSXElementOrNull;
export function QueryCell<TData, TError extends ErrorLike>(
  opts: QueryCellOptionsNoEmpty<TData, TError>
): JSXElementOrNull;
export function QueryCell<TData, TError extends ErrorLike>(
  opts: QueryCellOptionsNoEmpty<TData, TError> | QueryCellOptionsWithEmpty<TData, TError>
) {
  const { query } = opts;

  if (query.status === "success") {
    if ("empty" in opts && (query.data == null || (Array.isArray(query.data) && query.data.length === 0))) {
      return opts.empty(query);
    }
    return opts.success(query as any);
  }
  if (query.status === "error") {
    return (
      opts.error?.(query) ?? (
        <Alert severity="error" title="Something went wrong" message={query.error.message} />
      )
    );
  }
  if (query.status === "loading") {
    return opts.loading?.(query) ?? <Loader />;
  }
  if (query.status === "idle") {
    return opts.idle?.(query) ?? <Loader />;
  }
  // impossible state
  return null;
}

type inferProcedures<TObj extends ProcedureRecord<any, any, any, any, any, any>> = {
  [TPath in keyof TObj]: {
    input: inferProcedureInput<TObj[TPath]>;
    output: inferProcedureOutput<TObj[TPath]>;
  };
};
type TQueryValues = inferProcedures<AppRouter["_def"]["queries"]>;
type TQueries = AppRouter["_def"]["queries"];
type TError = TRPCClientErrorLike<AppRouter>;

const withQuery = <TPath extends keyof TQueryValues & string>(
  pathAndInput: [path: TPath, ...args: inferHandlerInput<TQueries[TPath]>],
  params?: UseTRPCQueryOptions<TPath, TQueryValues[TPath]["input"], TQueryValues[TPath]["output"], TError>
) => {
  return function WithQuery(
    opts: Omit<
      Partial<QueryCellOptionsWithEmpty<TQueryValues[TPath]["output"], TError>> &
        QueryCellOptionsNoEmpty<TQueryValues[TPath]["output"], TError>,
      "query"
    >
  ) {
    const query = trpc.useQuery(pathAndInput, params);
    return <QueryCell query={query} {...opts} />;
  };
};

export { withQuery };
