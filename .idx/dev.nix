# Configuration pour Firebase Studio (Google Project IDX)
# https://studio.firebase.google.com/
{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.firebase-tools
  ];

  env = {
    PORT = "3000";
  };

  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
    ];

    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
      onStart = {
        # Commande exécutée au démarrage de l'espace de travail
      };
    };

    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev"];
          manager = "web";
          env = {
            PORT = "$PORT";
          };
        };
      };
    };
  };
}
