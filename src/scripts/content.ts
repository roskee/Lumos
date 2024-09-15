import { Selector } from "../contentConfig";

const getHighlightedContent = (): string => {
  const selection = window.getSelection();
  return selection ? selection.toString().trim() : "";
};

/**
 * Get content from current tab.
 *
 * @param {Selector[]} selectors - selector queries to get content, i.e. document.querySelector().
 * @param {Selector[]} selectorsAll - selectorAll queries to get content, i.e. document.querySelectorAll().
 * @param {string?} customContext - custom context to get content.
 * @returns {[string, boolean, string[]]} - Tuple of content, boolean indicating if content was highlighted content, and an array of image URLs
 */
export const getHtmlContent = (
  selectors: Selector[],
  selectorsAll: Selector[],
  customContext?: string,
): [string, boolean, string[]] => {
  // if any content is highlighted, return the highlighted content
  const highlightedContent = getHighlightedContent();
  if (highlightedContent !== "") {
    return [highlightedContent, true, []];
  }

  // otherwise, return content from selected elements
  const elements: {element: Element, template?: string}[] = [];

  // process selector queries
  if (selectors.length > 0) {
    for (const selector of selectors) {
      const selectedElement = document.querySelector(selector.selector);
      if (selectedElement !== null) {
        elements.push({element: selectedElement, template: selector.template});
      }
    }
  }

  // process selectorAll queries
  if (selectorsAll.length > 0) {
    for (const selectorAll of selectorsAll) {
      const selectedElements = document.querySelectorAll(selectorAll.selector);
      for (let i = 0; i < selectedElements.length; i++) {
        elements.push({element: selectedElements[i], template: selectorAll.template});
      }
    }
  }

  // retrieve content from selected elements
  const parser = new DOMParser();
  let content = "";
  const imageURLs: string[] = [];

  for (const element of elements) {
    const doc = parser.parseFromString(element.element.outerHTML, "text/html");
    let textContent = doc.body.innerText || "";

    // Use a regular expression to replace contiguous white spaces with a single space
    textContent = textContent.replace(/\s+/g, " ").trim();

    // update textContent with template if available
    if (element.template)
      textContent = element.template.replace("{{content}}", textContent)

    // append textContent to overall content
    content += textContent + "\n";

    // find img elements and add src (URL) to imageURLs list
    const imageElements = doc.querySelectorAll("img");
    imageElements.forEach((imageElement) => {
      const imageURL = imageElement.getAttribute("src");
      if (imageURL) {
        imageURLs.push(imageURL);
      }
    });
  }

  // add custom context to content if available
  if (customContext)
    content += "\n\n" + `Additional Context: ${customContext}`;

  return [content, false, imageURLs];
};
