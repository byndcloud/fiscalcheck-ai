{ pkgs }: {
  # Stack do FiscalCheck AI no Replit (piloto). Para a topologia do MVP:
  #
  # - O Postgres e o Redis usados pelo app são serviços GERENCIADOS do
  #   Replit (não rodam in-process aqui). O app conecta via DATABASE_URL
  #   e REDIS_URL configurados em Secrets.
  # - Os pacotes `postgresql_16` e `redis` abaixo ficam disponíveis no
  #   ambiente Nix para fallback de dev local dentro do Repl (psql,
  #   redis-cli, scripts de migração). Eles não substituem os serviços
  #   gerenciados — apenas as ferramentas de linha de comando deles.
  deps = [
    # Node.js + pnpm
    pkgs.nodejs_22
    pkgs.nodePackages.pnpm

    # Python + uv
    pkgs.python312
    pkgs.python312Packages.pip
    pkgs.uv

    # Clientes de banco / cache (CLI). Os SERVIÇOS são gerenciados
    # pelo Replit (ver replit.md §4 e §5).
    pkgs.postgresql_16
    pkgs.redis

    # Utilitários
    pkgs.git
    pkgs.gnumake
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
    PYTHONBIN = "${pkgs.python312}/bin/python3.12";
    LANG = "pt_BR.UTF-8";
  };
}
