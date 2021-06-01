import normalizeTailwindDirectives from './lib/normalizeTailwindDirectives'
import expandTailwindAtRules from './lib/expandTailwindAtRules'
import expandApplyAtRules from './lib/expandApplyAtRules'
import evaluateTailwindFunctions from '../lib/evaluateTailwindFunctions'
import substituteScreenAtRules from '../lib/substituteScreenAtRules'
import collapseAdjacentRules from './lib/collapseAdjacentRules'
import { createContext } from './lib/setupContextUtils'
import log from '../util/log'

let warned = false

export default function processTailwindFeatures(setupContext) {
  return function (root, result) {
    if (!warned) {
      log.warn([
        `You have enabled the JIT engine which is currently in preview.`,
        'Preview features are not covered by semver, may introduce breaking changes, and can change at any time.',
      ])
      warned = true
    }

    function registerDependency(fileName, type = 'dependency') {
      result.messages.push({
        type,
        plugin: 'tailwindcss',
        parent: result.opts.from,
        [type === 'dir-dependency' ? 'dir' : 'file']: fileName,
      })
    }

    let tailwindDirectives = normalizeTailwindDirectives(root)

    let context = setupContext({
      tailwindDirectives,
      registerDependency,
      createContext(tailwindConfig, changedContent) {
        return createContext(tailwindConfig, changedContent, tailwindDirectives, root)
      },
    })(root, result)

    expandTailwindAtRules(context)(root, result)
    expandApplyAtRules(context)(root, result)
    evaluateTailwindFunctions(context)(root, result)
    substituteScreenAtRules(context)(root, result)
    collapseAdjacentRules(context)(root, result)
  }
}