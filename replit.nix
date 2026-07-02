{ pkgs }: {
  # Complemento aos `modules` do .replit (nodejs-22, python-3.12,
  # postgresql-16). Aqui entram apenas ferramentas que os modules não
  # cobrem: pnpm, uv e utilitários de linha de comando. Node, Python e
  # o Postgres gerenciado vêm dos modules — não duplicar aqui.
  deps = [
    # Gerenciadores de pacote
    pkgs.nodePackages.pnpm
    pkgs.uv

    # Utilitários
    pkgs.git
    pkgs.openssl
    pkgs.curl
    pkgs.jq

    # Bibliotecas C/C++ frequentemente exigidas por wheels Python
    pkgs.gcc
    pkgs.libffi
    pkgs.openssl.dev
    pkgs.zlib
  ];

  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.stdenv.cc.cc.lib
      pkgs.zlib
      pkgs.openssl
    ];
    LANG = "pt_BR.UTF-8";
  };
}
