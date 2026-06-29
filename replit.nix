{ pkgs }: {
  deps = [
    # Node.js + pnpm
    pkgs.nodejs_22
    pkgs.nodePackages.pnpm

    # Python + uv
    pkgs.python312
    pkgs.python312Packages.pip
    pkgs.uv

    # Banco / cache
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
