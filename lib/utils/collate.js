import path from 'upath'

/**
 * Determines the output file path when collating files by folder name.
 * Returns destFolder if srcFileName ends with collateAtFolderName,
 * otherwise joins destFolder with the portion of srcFileName after the folder name.
 * @param {string} collateAtFolderName The folder name to collate at
 * @param {string} destFolder The destination folder path
 * @param {string} srcFileName The source file path
 * @returns {string} The resolved output path
 * @memberof ui
 */
export function collate (collateAtFolderName, destFolder, srcFileName) {
  // ignore if the srcFileName ends with the collateAtFolderName
  const nameParts = srcFileName.split('/')
  if (nameParts[nameParts.length - 1] === collateAtFolderName) {
    return destFolder
  }
  const startOfCollatePath = srcFileName.indexOf(collateAtFolderName) + collateAtFolderName.length + 1
  return path.join(destFolder, srcFileName.substr(startOfCollatePath))
}
