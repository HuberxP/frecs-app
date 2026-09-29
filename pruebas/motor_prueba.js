// Carga docs/motor.js en Node con datos reales de la base local y llama cada consulta
const fs = require("fs"), vm = require("vm"), { execFileSync } = require("child_process");
const psql = (sql, rol) => execFileSync("su", ["postgres", "-c", "psql -p 5439 -d frecs -At -v ON_ERROR_STOP=1 -q"], { input: `set role ${rol || "anon"};\n` + sql, maxBuffer: 1 << 28 }).toString().trim();
const tk = JSON.parse(psql("select ingresar('Huber','1234')::text;")).token;
const datos = JSON.parse(psql(`select datos_consulta('${tk}')::text;`));
const ctx = { console, Intl, crypto: require("crypto").webcrypto, btoa: s => Buffer.from(s, "binary").toString("base64") };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + "/../docs/motor.js", "utf8") + "\nthis.MOTOR = MOTOR;", ctx);
const M = ctx.MOTOR;
M.cargar(datos);
let fallos = 0;
const llamar = (fn, ...a) => JSON.parse(M.llamar(fn, [tk, ...a]));
for (const fn of ["webInit", "webInventario", "webCatalogo", "webCanales", "webResumen", "webPocos", "webHuecos", "webVacios", "webOrganizar", "webConsolidar", "webInfiltrados", "webMezclados", "webConsumo", "webCarpa", "webBarriles", "webLimbo", "webTurno"]) {
  const r = llamar(fn);
  const n = r.ok ? (Array.isArray(r.data) ? r.data.length : Object.keys(r.data || {}).length) : 0;
  console.log((r.ok ? "✅ " : "❌ ") + fn.padEnd(16) + (r.ok ? `${n} elementos` : r.error));
  if (!r.ok) fallos++;
}
const ini = llamar("webInit").data;
console.log("   filas inventario:", ini.inv.filas.length, "· catálogo:", ini.cat.length, "· turno abierto:", ini.turno.turno ? ini.turno.turno.texto : "no", "· sync:", JSON.stringify(ini.sync));
const f0 = ini.inv.filas.find(f => f.fis);
console.log("   ejemplo:", JSON.stringify({ s: f0.s, p: f0.p, m: f0.m, z: f0.z, vf: f0.vf, d: f0.d, vida: f0.vida, T1: f0.T1, T2: f0.T2, KA: f0.KA, actTxt: f0.actTxt }));
const av = llamar("webAvanzados", "VENCIDOS"); console.log((av.ok ? "✅" : "❌") + " webAvanzados VENCIDOS", av.ok ? "" : av.error);
const ac = llamar("webAcomodar", "2222", "2027-01-01"); console.log((ac.ok ? "✅" : "❌") + " webAcomodar", ac.ok ? "" : ac.error);
const en = llamar("webEnvasado", "2222"); console.log((en.ok ? "✅" : "❌") + " webEnvasado", en.ok ? "" : en.error);
console.log(fallos ? `${fallos} FALLOS` : "TODO OK");
