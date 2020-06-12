import { ODataAnnotations } from "odata";

/*
 * http://docs.oasis-open.org/odata/odata-json-format/v4.0/os/odata-json-format-v4.0-os.html#_Instance_Annotations
 * Annotations are name/value pairs that have a dot (.) as part of the name.
 * $odata.context - system annotations (supported)
 * @com.contoso - custom annotation
 * com.contoso - also valid custom annotation
 * Orders@odata.context - scoped system annotations
 * Orders@com.contoso - scoped custom annotations
 */
export function getAnnotations<K extends { [key: string]: string }>(
  obj: K,
): ODataAnnotations {
  const annotations: ODataAnnotations = {};
  const receivedKeys = Object.getOwnPropertyNames(obj);
  const defaultNamespaces = ["$odata", "odata"];
  const namespaceDelimiter = ".";
  const propertyDelimiter = "@";
  const getSubContainer = (subKey: string) => {
    if (!annotations[subKey]) annotations[subKey] = {};
    return annotations[subKey] as ODataAnnotations;
  };
  for (const key of receivedKeys) {
    const parts = key.split(namespaceDelimiter);
    if (parts.length <= 1)
      // not an annotation. Should contain '.' (dot)
      continue;

    // at this point it is defintely annotation so delete it from original object
    const value = obj[key];
    delete obj[key];

    const prefix = parts[0]; // get left part and split it
    const prefixParts = prefix.split(propertyDelimiter);

    // Annotation in the form of @Orders@com.contoso is not supported
    // It will be added to root annotation object as is
    if (prefixParts.length > 2) {
      annotations[key] = value;
      continue;
    }

    // at this point prefixParts.length is 1 or 2
    const namespace = prefixParts[prefixParts.length - 1];
    const container =
      prefixParts.length === 1 ? annotations : getSubContainer(prefixParts[0]);

    // multiple dots considered custom annotation and will be added as is preserving
    // the namespace
    let annotationKey = parts.length == 2 ? parts[1] : parts.slice(1).join(".");
    if (defaultNamespaces.indexOf(namespace) === -1)
      annotationKey = `${namespace}.${annotationKey}`;

    // set annotation
    container[annotationKey] = value;
  }

  return annotations;
}
