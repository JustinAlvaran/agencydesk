import { spawnSync } from 'node:child_process';
for (const name of ['verify','automation','leads','inquiry-preferences','zoko-provider','recipient-suppression','website-intake','service-chat','operating-limits','crm-backend']) {
 const result = spawnSync(process.execPath, [`tests/database/${name}.mjs`], {stdio:'inherit'});
 if (result.status !== 0) process.exit(result.status ?? 1);
}
