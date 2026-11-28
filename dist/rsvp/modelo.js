// The private receiver and the guest form use the same rules. No personal data is stored here.
function kazaGrupo_() {
  "use strict";
  const modalidades = {individual:"Individual", pareja:"Pareja", familia:"Familia o grupo"};
  function cupo(value) {
    if (value === "" || value == null) return 10;
    if ((typeof value !== "string" && typeof value !== "number") || !/^([1-9]|1\d|20)$/.test(String(value))) throw Error("El cupo debe ser de 1 a 20 personas.");
    return Number(value);
  }
  function nombre(value) {
    if (typeof value !== "string" || /[\u0000-\u001F\u007F]/.test(value)) throw Error("Revisá el nombre de cada persona.");
    const limpio=value.trim().replace(/\s+/g," ");
    if (!limpio || limpio.length>100) throw Error("Completá el nombre de cada persona (hasta 100 caracteres).");
    return limpio;
  }
  function validar(datos, maximo) {
    const max=cupo(maximo), lista=datos?.personas, modo=datos?.modalidad;
    if (!Array.isArray(lista) || !lista.length || lista.length>max) throw Error("La cantidad de personas no coincide con el cupo de esta invitación.");
    if (datos.respuesta==="no") {
      if (lista.length!==1 || modo!=null || lista[0]?.tipo!=null || lista[0]?.edad!=null) throw Error("Para avisar una ausencia solo hace falta un nombre.");
      return {respuesta:"no",modalidad:null,personas:[{nombre:nombre(lista[0]?.nombre)}]};
    }
    if (datos.respuesta!=="si" || typeof modo!=="string" || !Object.prototype.hasOwnProperty.call(modalidades,modo) ||
        (modo==="individual" ? lista.length!==1 : modo==="pareja" ? lista.length!==2 : lista.length<2)) throw Error("Revisá la modalidad y la cantidad de personas.");
    const personas=lista.map(p=>{
      const n=nombre(p?.nombre);
      if (p.tipo==="adulta" && p.edad==null) return {nombre:n,tipo:"adulta"};
      if (p.tipo==="menor" && Number.isInteger(p.edad) && p.edad>=0 && p.edad<18) return {nombre:n,tipo:"menor",edad:p.edad};
      throw Error("Indicá si cada persona tiene 18 años o más. Para menores, completá una edad de 0 a 17.");
    });
    return {respuesta:"si",modalidad:modo,personas};
  }
  return {modalidades,cupo,validar};
}
if (typeof module==="object" && module.exports) module.exports=kazaGrupo_;
