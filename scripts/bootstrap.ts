import { parseArgs } from "node:util";
import { BootstrapFamilyUseCase } from "@/application/bootstrapFamily";
import { ScryptPasswordHasher } from "@/infrastructure/auth/passwordHasher";
import { DrizzleAuthRepository } from "@/infrastructure/db/auth";

function promptHiddenPassword(label: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    process.stdout.write(label);

    let input = "";
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const onData = (char: string) => {
      if (char === "") {
        cleanup();
        reject(new Error("Cancelado"));
        return;
      }
      if (char === "\r" || char === "\n") {
        cleanup();
        process.stdout.write("\n");
        resolve(input);
        return;
      }
      if (char === "" || char === "\b") {
        input = input.slice(0, -1);
        return;
      }
      input += char;
    };

    function cleanup() {
      stdin.removeListener("data", onData);
      stdin.setRawMode?.(wasRaw ?? false);
      stdin.pause();
    }

    stdin.on("data", onData);
  });
}

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      name: { type: "string" },
      "family-name": { type: "string", default: "Mi familia" },
      currency: { type: "string", default: "MXN" },
    },
  });

  if (!values.email || !values.name) {
    console.error('Faltan argumentos. Uso: --email tu@correo.com --name "Tu Nombre"');
    process.exit(1);
  }

  const password = await promptHiddenPassword("Contraseña (no se muestra en pantalla): ");
  if (password.length < 10) {
    console.error("La contraseña debe tener al menos 10 caracteres.");
    process.exit(1);
  }

  const useCase = new BootstrapFamilyUseCase(new DrizzleAuthRepository(), new ScryptPasswordHasher());
  const user = await useCase.execute({
    familyName: values["family-name"]!,
    currency: values.currency!,
    email: values.email,
    password,
    name: values.name,
  });

  console.log(`Listo. Usuario creado: ${user.email} (id ${user.id}, family ${user.familyId}).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
