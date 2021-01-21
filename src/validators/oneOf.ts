/* eslint-disable functional/no-this-expression */
import { ValidationError } from '../errors';
import type { Either, Primitives, Schema, SomeSchema, TypeOf } from '../types';
import { TYPEOFWEB_SCHEMA, ONE_OF_VALIDATOR, InitialModifiers, isSchema } from '../validators';

import { __validate } from './__validate';

// `U extends (Primitives)[]` and `[...U]` is a trick to force TypeScript to narrow the type correctly
// thanks to schema, there's no need for "as const": oneOf(['a', 'b']) works as oneOf(['a', 'b'] as const)
export type OneOfSchema = ReturnType<typeof oneOf>;
export const oneOf = <U extends readonly (Primitives | SomeSchema<any>)[]>(
  values: readonly [...U],
) => {
  type TypeOfResult = {
    readonly [Index in keyof U]: U[Index] extends SomeSchema<any> ? TypeOf<U[Index]> : U[Index];
  }[number];

  return {
    [TYPEOFWEB_SCHEMA]: true,
    __validator: ONE_OF_VALIDATOR,
    __values: values,
    __type: {} as unknown,
    __modifiers: InitialModifiers,
    __validate(_schema, value) {
      return this.__values.reduce<Either<TypeOfResult>>(
        (acc, valueOrValidator) => {
          if (acc._t === 'right') {
            return acc;
          }
          if (isSchema(valueOrValidator)) {
            return __validate(valueOrValidator, value) as Either<TypeOfResult>;
          } else {
            const isValid = value === valueOrValidator;
            return isValid
              ? { _t: 'right', value: valueOrValidator as TypeOfResult }
              : { _t: 'left', value: new ValidationError(this, value) };
          }
        },
        { _t: 'left' } as Either<TypeOfResult>,
      );
    },
  } as Schema<TypeOfResult, typeof InitialModifiers, U, ONE_OF_VALIDATOR>;
};