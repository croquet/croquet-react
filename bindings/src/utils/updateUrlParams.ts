export default function updateUrlParams(newParams: string[], paramName: string) {
  const urlParams = new URLSearchParams(window.location.search)

  urlParams.delete(paramName)

  const oldParams = urlParams.toString()
  const debugParam = newParams.length > 0 ? paramName + '=' + newParams.join(',') : ''

  let newUrl = window.location.pathname

  if (oldParams) newUrl += `?${oldParams}`
  if (debugParam) newUrl += (oldParams ? '&' : '?') + debugParam

  window.history.replaceState({}, '', newUrl)
}
