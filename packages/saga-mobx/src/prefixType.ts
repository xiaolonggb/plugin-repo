import { NAMESPACE_SEP, namespaceSymbol } from './constants';

export default function prefixType(type, store) {
  const prefixedType = `${store[namespaceSymbol]}${NAMESPACE_SEP}${type}`;
  for (const effectKey in store) {
    if (effectKey === type) {
      return prefixedType;
    }
  }
  return type;
}
