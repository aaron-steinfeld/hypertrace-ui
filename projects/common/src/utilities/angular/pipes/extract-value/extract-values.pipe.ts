import { Pipe, PipeTransform } from '@angular/core';
import { isArray, isObject, uniq } from 'lodash-es';
import { Dictionary } from '../../../types/types';

/**
 * Extracts the value of a key from an array of objects.
 * Can be extended for more use cases in the future.
 *
 * Example:
 * ```
 * Value: [{ a: 1, b: 2 }, { a: 3, b: 4 }, { a: 3, b: 6 }]
 * Result: [1, 3]
 * ```
 */
@Pipe({
  name: 'htExtractValues'
})
export class ExtractValuesPipe implements PipeTransform {
  public transform(value: unknown[] | undefined, key: string, returnUniqueValuesOnly: boolean = true): unknown[] {
    const values: unknown[] = !isArray(value)
      ? []
      : (value ?? []).map(item =>
          isObject(item) && item.hasOwnProperty(key) ? (item as Dictionary<unknown>)?.[key] : undefined
        );

    return returnUniqueValuesOnly ? uniq(values) : values;
  }
}
