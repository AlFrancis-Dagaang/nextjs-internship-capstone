import { queries } from "../lib/db/index"

async function main() {
  const projects = await queries.projects.getAll()
  console.log("Connected. Projects:", projects)

  const tasks = await queries.tasks.getByProject(
    "00000000-0000-0000-0000-000000000000",
  )
  console.log("Tasks by project (flat array, expect []):", tasks)

  process.exit(0)
}

main().catch((err) => {
  console.error("Smoke test failed:", err)
  process.exit(1)
})
