const CSS_PREFIX = 'kwizzad';


export default function prefixCSSClasses(classNames) {
  return classNames
    .split(/\s+/)
    .map(className => `${CSS_PREFIX}-${className}`)
    .join(' ');
}
