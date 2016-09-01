// This list generated from frequency counting of methods.
// In future it can be auto-updated.

// To reproduce, run get_warmup_classes.sh against a vocab.txt file.
const vipClasses = [
  'java.io.File',
  'java.io.InputStream',
  'java.io.OutputStream',
  'java.io.PrintStream',
  'java.io.PrintWriter',
  'java.io.Writer',
  'java.lang.Boolean',
  'java.lang.Character',
  'java.lang.Class',
  'java.lang.Double',
  'java.lang.Exception',
  'java.lang.Float',
  'java.lang.Integer',
  'java.lang.Iterable',
  'java.lang.Long',
  'java.lang.Math',
  'java.lang.Object',
  'java.lang.String',
  'java.lang.StringBuffer',
  'java.lang.StringBuilder',
  'java.lang.System',
  'java.lang.Thread',
  'java.lang.Throwable',
  'java.util.ArrayList',
  'java.util.Arrays',
  'java.util.Calendar',
  'java.util.Collection',
  'java.util.Collections',
  'java.util.Date',
  'java.util.Enumeration',
  'java.util.HashMap',
  'java.util.HashSet',
  'java.util.Hashtable',
  'java.util.Iterator',
  'java.util.LinkedHashMap',
  'java.util.LinkedList',
  'java.util.List',
  'java.util.Map$Entry',
  'java.util.Map',
  'java.util.Properties',
  'java.util.Set',
  'java.util.Vector',
  'java.util.logging.Logger',
  'java.util.regex.Pattern',
];

function lookupClasses(content) {
  for (const className of vipClasses) {
    content.send('ice-lookup-quiet', className);
  }
}

export {
  lookupClasses as default,
};
