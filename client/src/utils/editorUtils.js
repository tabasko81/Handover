/**
 * Clean empty lines from HTML content on save.
 * Removes leading/trailing empty lines and limits consecutive empty lines to 3.
 */
export function cleanEmptyLinesOnSave(html) {
  if (!html) return html;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const isEmptyElement = (el) => {
    if (!el) return false;
    const textContent = el.textContent || '';
    const innerHTML = el.innerHTML || '';
    return !textContent.trim() &&
           (!innerHTML || innerHTML.match(/^[\s\u00A0\u200B-\u200D\uFEFF]*$/));
  };

  while (tempDiv.firstChild) {
    const firstChild = tempDiv.firstChild;
    if (firstChild.nodeType === Node.ELEMENT_NODE) {
      if (isEmptyElement(firstChild) && (firstChild.tagName === 'P' || firstChild.tagName === 'DIV' || firstChild.tagName === 'BR')) {
        tempDiv.removeChild(firstChild);
        continue;
      }
    } else if (firstChild.nodeType === Node.TEXT_NODE) {
      if (!firstChild.textContent.trim()) {
        tempDiv.removeChild(firstChild);
        continue;
      }
    }
    break;
  }

  while (tempDiv.lastChild) {
    const lastChild = tempDiv.lastChild;
    if (lastChild.nodeType === Node.ELEMENT_NODE) {
      if (isEmptyElement(lastChild) && (lastChild.tagName === 'P' || lastChild.tagName === 'DIV' || lastChild.tagName === 'BR')) {
        tempDiv.removeChild(lastChild);
        continue;
      }
    } else if (lastChild.nodeType === Node.TEXT_NODE) {
      if (!lastChild.textContent.trim()) {
        tempDiv.removeChild(lastChild);
        continue;
      }
    }
    break;
  }

  const children = Array.from(tempDiv.childNodes);
  const processedChildren = [];
  let emptyLineCount = 0;
  let lastWasEmpty = false;

  children.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const isEmpty = isEmptyElement(child) && (child.tagName === 'P' || child.tagName === 'DIV' || child.tagName === 'BR');

      if (isEmpty) {
        if (lastWasEmpty) {
          emptyLineCount++;
          if (emptyLineCount > 3) return;
        } else {
          emptyLineCount = 1;
          lastWasEmpty = true;
        }
        processedChildren.push(child);
      } else {
        emptyLineCount = 0;
        lastWasEmpty = false;
        processedChildren.push(child);
      }
    } else if (child.nodeType === Node.TEXT_NODE) {
      if (child.textContent.trim()) {
        processedChildren.push(child);
        emptyLineCount = 0;
        lastWasEmpty = false;
      }
    } else {
      processedChildren.push(child);
    }
  });

  tempDiv.innerHTML = '';
  processedChildren.forEach(child => tempDiv.appendChild(child));

  let removed = true;
  while (removed && tempDiv.firstChild) {
    removed = false;
    const firstChild = tempDiv.firstChild;
    if (firstChild.nodeType === Node.ELEMENT_NODE) {
      if (isEmptyElement(firstChild) && (firstChild.tagName === 'P' || firstChild.tagName === 'DIV' || firstChild.tagName === 'BR')) {
        tempDiv.removeChild(firstChild);
        removed = true;
      }
    } else if (firstChild.nodeType === Node.TEXT_NODE) {
      if (!firstChild.textContent.trim()) {
        tempDiv.removeChild(firstChild);
        removed = true;
      }
    }
  }

  removed = true;
  while (removed && tempDiv.lastChild) {
    removed = false;
    const lastChild = tempDiv.lastChild;
    if (lastChild.nodeType === Node.ELEMENT_NODE) {
      if (isEmptyElement(lastChild) && (lastChild.tagName === 'P' || lastChild.tagName === 'DIV' || lastChild.tagName === 'BR')) {
        tempDiv.removeChild(lastChild);
        removed = true;
      }
    } else if (lastChild.nodeType === Node.TEXT_NODE) {
      if (!lastChild.textContent.trim()) {
        tempDiv.removeChild(lastChild);
        removed = true;
      }
    }
  }

  const allBrTags = tempDiv.querySelectorAll('br');
  allBrTags.forEach(br => {
    let node = br.nextSibling;
    let hasContentAfter = false;
    while (node) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        hasContentAfter = true;
        break;
      }
      if (node.nodeType === Node.ELEMENT_NODE && !isEmptyElement(node)) {
        hasContentAfter = true;
        break;
      }
      node = node.nextSibling;
    }

    if (!hasContentAfter) {
      let isAtEnd = true;
      node = br;
      while (node && node.parentNode === tempDiv) {
        node = node.nextSibling;
        if (node && node.nodeType === Node.ELEMENT_NODE && !isEmptyElement(node)) {
          isAtEnd = false;
          break;
        }
        if (node && node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          isAtEnd = false;
          break;
        }
      }

      if (isAtEnd) br.remove();
    }
  });

  return tempDiv.innerHTML;
}
