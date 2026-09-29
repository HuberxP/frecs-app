// Conexión con Supabase. La clave es la PÚBLICA (publishable/anon): con ella no se puede
// leer ninguna tabla, solo llamar a las funciones que piden nombre + PIN.
window.FRECS_CONFIG = {
  supabaseUrl: "https://wktznckezlxptocmhhze.supabase.co",
  supabaseKey: "sb_publishable_79Eh5anXcSceRed8DV8EuA_sPmkL8RF",
  // URL de la implementación del BOT en Apps Script (la que termina en /exec). Solo sirve para ⟳:
  // Apps Script revisa la sesión en Supabase antes de consultar el WMS. Vacía = sin botón ⟳.
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbxoUKnTafZ5TwIf66IOgZKdvQkLjdrsBumJzTA1hjUBVCblcrNp-zyFb5Dlmv5OwRGY/exec"
};
