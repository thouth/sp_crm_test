create table leads (
  id serial primary key,
  dato text,
  firmanavn text,
  orgnr text,
  status text,
  kanal text,
  ansvarlig_selger text,
  arsak_avslag text,
  eksisterende_kunde text,
  kwp numeric,
  ppa_pris numeric
);
