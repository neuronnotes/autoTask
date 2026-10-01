// Atalho para o template "Curso" do autoTask, bastando usar await dv.view("scripts/autoTask/course");
// ao invés de await dv.view("scripts/autoTask", { template: "curso" });
await dv.view("scripts/autoTask", Object.assign({ template: "Curso" }, typeof input !== "undefined" && input ? input : {}));
