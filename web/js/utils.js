export function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Allowlist of safe tags produced by execCommand or inserted explicitly.
const ALLOWED_TAGS = new Set([
  'b','strong','i','em','u','s','del','mark','sub','sup',
  'ul','ol','li','p','h3','blockquote','pre','code','br','hr',
  'img','a','span',
]);

export function sanitizeHTML(html) {
  if (!html) return '';
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  cleanNode(tpl.content);
  return tpl.innerHTML;
}

function sanitizeAttrs(el) {
  const tag = el.tagName.toLowerCase();

  if (tag === 'img') {
    const src = el.getAttribute('src') || '';
    const alt = el.getAttribute('alt') || '';
    [...el.attributes].forEach(a => el.removeAttribute(a.name));
    if (src.startsWith('data:image/')) el.setAttribute('src', src);
    if (alt) el.setAttribute('alt', alt);

  } else if (tag === 'a') {
    const href = el.getAttribute('href') || '';
    [...el.attributes].forEach(a => el.removeAttribute(a.name));
    if (/^https?:\/\//i.test(href)) {
      el.setAttribute('href', href);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }

  } else if (tag === 'span') {
    // Allow only background-color style (highlight support)
    const style = el.getAttribute('style') || '';
    [...el.attributes].forEach(a => el.removeAttribute(a.name));
    const m = style.match(/background-color\s*:\s*([^;]+)/i);
    if (m) el.setAttribute('style', `background-color:${m[1].trim()}`);

  } else {
    [...el.attributes].forEach(a => el.removeAttribute(a.name));
  }
}

function cleanNode(node) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase();
      if (ALLOWED_TAGS.has(tag)) {
        sanitizeAttrs(child);
        cleanNode(child);
      } else {
        // Unwrap — preserve text content, drop the tag
        while (child.firstChild) node.insertBefore(child.firstChild, child);
        node.removeChild(child);
      }
    }
  }
}
