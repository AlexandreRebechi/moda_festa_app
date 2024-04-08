

CREATE TABLE IF NOT EXISTS pessoas(
	id serial primary key  not null,
	nome varchar(100) not null,
	email varchar(100) not null,
	telefone varchar(15) not null,
	cep varchar(9) not null,
	logradouro varchar(50) not null,
	bairro varchar(50) not null,
	numero varchar(50) not null,
	complemento varchar(50) not null,
	observacoes varchar(300) not null,
	data_cadastro TIMESTAMP not null,
	username varchar(50) not null,
	cpf varchar(14) not null,
	password varchar(6) not null,
	data_ultimo_login TIMESTAMP not null,
	tipo char(1) not null check(tipo = 'C' or tipo = 'F')
);
SELECT p.nome,p.email, p.telefone, p.cep,
                p.logradouro, p.bairro, p.complemento, p.observacoes, 
                to_char(p.data_cadastro, 'dd/mm/yyyy') as data_cadastro, 
                p.username, p.password, 
                 to_char(p.data_ultimo_login, 'dd/mm/yyyy') as data_ultimo_login, 
                c.cpf, c.rg, c.cnpj, c.ie 
                FROM pessoas p left join clientes c on (p.id=c.id_pessoa)
                order by p.id asc;

CREATE TABLE perfis (
	id serial not null primary key ,
	descricao text not null
);

CREATE TABLE funcionalidades (
	id serial not null primary key,
	descricao text not null
	
	
);
CREATE TABLE perfis_funcionalidades (
	id_funcionalidade integer not null,
	id_perfil integer not null,
	foreign key (id_funcionalidade) references funcionalidades (id),
	foreign key (id_perfil) references perfis (id),
	primary key(id_funcionalidade, id_perfil)
	
);
select f.id, f.descricao from funcionalidades f, perfis_funcionalidades pf where pf.id_funcionalidade = f.id and pf.id_funcionalidade = 1



CREATE TABLE IF NOT EXISTS clientes(
	rg varchar(9) not null,
	cnpj varchar(14) not null,
	ie varchar(14) not null,
	id_pessoa integer not null,
	foreign key (id_pessoa) references pessoas (id)
);


CREATE TABLE IF NOT EXISTS funcionarios (
	numero_ctps varchar(50) not null,
	data_contratacao date not null,
	data_demissao date not null,
	perfil integer not null,
	id_pessoa integer not null,
	foreign key (id_pessoa) references pessoas (id),
	foreign key (perfil) references perfis (id)
); 

CREATE TYPE statusReserva as ENUM('EM_ANALISE', 'APROVADA', 'NEGADA');

CREATE TABLE reservas (
	id serial not null primary key,
	data_inicio date not null,
	data_fim date not null,
	valor numeric(7,2) not null,
	valor_entrega numeric(7,2) not null,
	valor_total numeric(7,2) not null,
	observacoes varchar(300) not null,
	cliente integer not null,
	funcionario integer not null,
	status_reserva statusReserva not null,
	--status_reserva string not null,
	foreign key (cliente) references clientes (id_pessoa),
	foreign key (funcionario) references funcionarios (id_pessoa)

);

select r.id, r.data_inicio, r.data_fim, r.valor, r.valor_entrega, r.valor_total, r.observacoes, r.cliente, r.funcionario, r.status_reserva, 0 as produtos
from reservas r
order by id;

select p.id, p.descricao,  p.observacoes, p.valor_custo, p.valor_aluguel, p.valor_venda, p.tipo_produto 
from produtos p, reservas_produtos rp 
where rp.id_produto = p.id and rp.id_produto = 1

CREATE TABLE tiposProduto (
	id serial not null primary key,
	nome varchar(50) not null
);

CREATE TABLE produtos (
	id serial not null primary key,
	descricao varchar(300) not null,
	observacoes varchar(300) not null,
	valor_custo numeric(7,2) not null,
	valor_aluguel numeric(7,2) not null,
	valor_venda numeric(7,2) not null,
	tipo_produto integer not null,
	foreign key (tipo_produto) references tiposProduto (id)
	
);
CREATE TABLE reservas_produtos(
	id_reserva integer not null ,
	id_produto integer not null ,
	foreign key(id_reserva) references reservas(id),
	foreign key(id_produto) references produtos (id),
	primary key(id_reserva, id_produto)

);





CREATE TABLE fotos (
	id serial not null primary key,
	descricao varchar(300) not null,
	b64 text not null,
	produto_id integer not null,
	foreign key (produto_id) references produtos (id)
	
	
);

CREATE TYPE tiposPagamento as ENUM('NA_RETIRADA', 'ENTRADA_DEVOLUCAO', 'PARCELADO');


CREATE TABLE locacoes (
	id serial not null primary key,
	data_retirada date not null,
	data_previsao_entrega date not null,
	data_entrega date null,
	data_previsao_pagamento date not null,
	valor_total numeric(7,2) not null,
	valor_pago numeric(7,2) not null,
	observacoes varchar(300) not null,
	funcionario integer not null,
	tipos_pagamento tiposPagamento not null,
	foreign key (funcionario) references pessoas(id)
	
	
	
);




CREATE TABLE locacoes_reservas(
	id integer not null primary key,
	id_locacao integer not null,
	id_reserva integer not null,
	foreign key (id_locacao) references locacoes(id),
	foreign key (id_reserva) references reservas(id)
	--primary key(id_locacao, id_reserva)

);

CREATE TABLE parcelamentos (
	id serial not null primary key,
	numero_parcela integer not null,
	data_previsao_pagamento date not null,
	data_pagamento date null,
	valor_total numeric(7,2) not null,
	valot_pago numeric(7,2) not null,
	id_locacao integer not null,
	foreign key(id_locacao) references locacoes (id)
	
	
);
CREATE TABLE sitacao (
	id serial not null primary key,
	descricao varchar(300) not null
);

CREATE TABLE acompanhamento (
	id serial not null primary key,
	sequencia_passo integer not null,
	data date not null,
	observacoes varchar(300) not null,
	id_sitacao integer not null,
	id_locacao integer not null,
	foreign key (id_locacao) references locacoes(id),
	foreign key (id_sitacao) references sitacao(id)
);

CREATE TABLE usuario(
	nickname varchar(100) not null,
	senha varchar(100) not null,
	data_cadastro date not null,
	situacao varchar(1) not null,
	primary key(nickname, senha)

)

insert into usuario(nickname, senha, data_cadastro, situacao) values('alexandre', '1234', '2024/03/13', 'A')
