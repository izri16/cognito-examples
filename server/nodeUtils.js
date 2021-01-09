import {dirname} from 'path'
import {fileURLToPath} from 'url'

// Note: there is not __dirname when "type: module" for node
export const __dirname = dirname(fileURLToPath(import.meta.url))
