// Runs after Claude edits a file. If it was a .ts/.tsx file, typecheck the
// project. On errors, exit 2 so Claude sees them and fixes them right away.
import { execSync } from 'node:child_process'

let input = ''
process.stdin.on('data', (chunk) => (input += chunk))
process.stdin.on('end', () => {
  let file = ''
  try {
    file = JSON.parse(input)?.tool_input?.file_path ?? ''
  } catch {
    process.exit(0)
  }
  if (!/\.tsx?$/.test(file)) process.exit(0)

  try {
    execSync('npx tsc -b', {
      cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
      stdio: 'pipe',
    })
    process.exit(0)
  } catch (err) {
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`.trim()
    process.stderr.write(`TypeScript errors after editing ${file}:\n${out.slice(0, 4000)}\n`)
    process.exit(2)
  }
})
