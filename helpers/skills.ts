import fs from "fs";
import path from "path";

export function loadSkill(skillName: string): string {
    const skillPath = path.join(process.cwd(), "skills", skillName, "SKILL.md");
    return fs.readFileSync(skillPath, "utf-8");
}