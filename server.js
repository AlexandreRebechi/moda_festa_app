const express = require('express');
var pg = require('pg');

var sw = express();

sw.use(express.json());

sw.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    next();
});

const config = {
    host: 'localhost',
    user: 'postgres',
    database: 'moda_festa_BD',
    password: 'postgres',
    port: 5435
};

//definia conexao com o banco de dados.
const postgres = new pg.Pool(config);

//definicao do primeiro serviço web.
sw.get('/', (req, res) => {
    res.send('Ola Mundo primeiro teste');
})

sw.get('/listcliente', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não conseguiu acessar o DB :" + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query(`SELECT p.nome, p.telefone, p.cep, 
                                 p.logradouro, p.bairro, p.complemento, p.observacoes,   
                                 p.data_cadastro, 
                                 p.username, p.password, p.data_ultimo_login, 
                                 c.cpf, c.rg, c.cnpj, c.ie 
                         FROM pessoas p left join clientes c on (p.nome=c.cpf) 
                         order by p.nome asc;`, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows);
                }
            });
        }
    });
});

sw.get('/deletecliente/:id', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não consequiu acessar o banco de dados!")
        } else {
            var q1 = {
                text: `delete from clientes where cpf = $1`,
                values: [req.params.id]
            }
            var q2 = {
                text: `delete FROM pessoas where id = $1`,
                values: [req.params.id]
            }

        }
        client.query(q1, function (err, result) {

            if (err) {
                console.log(err);
                res.status(400).send(`{${err}}`)
            } else {
                client.query(q2, function (err, result) {
                    done(); // closing the connection;
                    if (err) {
                        console.log(err);
                        res.status(400).send(`{${err}}`);
                    } else {
                        res.status(200).send({ 'id': req.params.id }) //retorna o id deletado 

                    }
                })


            }
        })
    });
});

sw.post('/insertcliente', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não coseguiu acessar o BD " + log);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: `insert into pessoas (nome, email, telefone, cep, 
                                            logradouro, bairro, numero, complemento,observacoes,
                                            data_cadastro, username, password, data_ultimo_login)
                       values($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), $10, $11, now())
                       returning nome, email, telefone, cep, 
                                logradouro, bairro, numero, complemento, observacoes, 
                                to_char(data_cadastro, \'dd/mm/yyyy\') as data_cadastro,
                                username, password,
                                to_char(data_ultimo_login, \'dd/mm/yyyy\') as data_ultimo_login`,
                values: [
                    req.body.nome,
                    req.body.email,
                    req.body.telefone,
                    req.body.cep,
                    req.body.logradouro,
                    req.body.bairro,
                    req.body.numero,
                    req.body.complemento,
                    req.body.observacoes,
                    req.body.username,
                    req.body.password
                ]
            }
            var q2 = {
                text: `insert into clientes (cpf, rg, cnpj, ie, id_pessoa)
                    values ($1, $2, $3, $4, $5) 
                    returning cpf, rg, cnpj, ie, id_pessoa;`,
                values: [
                    req.body.cpf,
                    req.body.rg,
                    req.body.cnpj,
                    req.body.ie,
                    req.body.id_pessoa
                ]
            }

            console.log(q1);

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no insert');
                    res.status(400).send(`{${err}}`);
                } else {
                    client.query(q2, function (err, result2) {
                        if (err) {
                            console.log('retornou 400 no insert');
                            res.status(400).send(`{${err}}`);
                        } else {
                            done(); // closing the connection;
                            console.log(`retornou 201 no insertcliente`)
                            res.status(201).send({
                                "id": result1.rows[0].codigo,
                                "nome": result1.rows[0].nome,
                                "email": result1.rows[0].email,
                                "telefone": result1.rows[0].telefone,
                                "cep": result1.rows[0].cep,
                                "logradouro": result1.rows[0].logradouro,
                                "bairro": result1.rows[0].bairro,
                                "numero": result1.rows[0].numero,
                                "complemento": result1.rows[0].complemento,
                                "observacoes": result1.rows[0].observacoes,
                                "username": result1.rows[0].username,
                                "password": result1.rows[0].password,
                                "cliente": {
                                    "cpf": result2.rows[0].cpf,
                                    "rg": result2.rows[0].rg,
                                    "cnpj": result2.rows[0].cnpj,
                                    "ie": result2.rows[0].ie,
                                    "id_pessoa": result2.rows[0].id_pessoa
                                }
                            })
                        }
                    });
                }

            });
        }
    });

});
sw.post('/updatecliente', function (req, res, next)  {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`)
        } else {
            var q1 = {
                text: `update pessoas set nome=$1, email=$2, telefone=$3, cep=$4, 
                logradouro=$5, bairro=$6, numero=$7, complemento=$8, observacoes = $9, 
                username=$10, password=$11 where id=$12
                returning nome, email, telefone, cep, 
                          logradouro, bairro, numero, complemento, observacoes,
                          to_char(data_cadastro, \'dd/mm/yyyy\') as data_cadastro,
                          username, password,
                          to_char(data_ultimo_login, \'dd/mm/yyyy\') as data_ultimo_login`,
                values: [
                    req.body.id,
                    req.body.nome,
                    req.body.email,
                    req.body.telefone,
                    req.body.cep,
                    req.body.logradouro,
                    req.body.bairro,
                    req.body.numero,
                    req.body.complemento,
                    req.body.observacoes,
                    req.body.username,
                    req.body.password

                ]
            }
            var q2 = {
                text: `update clientes set cpf=$1, rg=$2, cnpj=$3, ie=$4, id_pessoa=$5
                       returning cpf, rg, cnpj, ie, id_pessoa `,
                values: [
                    req.body.cpf,
                    req.body.rg,
                    req.body.cnpj,
                    req.body.ie,
                    req.body.id_pessoa
                ]

            }

            console.log(q1);
            console.log(q2);

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    client.query(q2, function (err, result2) {
                        if (err) {
                            console.log('retornou 400 no update');
                            console.log(err)
                            res.status(400).send(`{${err}}`)
                        } else {
                            done(); // closing the connection;

                            console.log('retornou 201 no updatecliente');
                            res.status(201).send({
                                "id": result1.rows[0].codigo,
                                "nome": result1.rows[0].nome,
                                "email": result1.rows[0].email,
                                "telefone": result1.rows[0].telefone,
                                "cep": result1.rows[0].cep,
                                "logradouro": result1.rows[0].logradouro,
                                "bairro": result1.rows[0].bairro,
                                "numero": result1.rows[0].numero,
                                "complemento": result1.rows[0].complemento,
                                "observacoes": result1.rows[0].observacoes,
                                "data_cadastro": result1.rows[0].data_cadastro,
                                "username": result1.rows[0].username,
                                "password": result1.rows[0].password,
                                "data_ultimo_login": result1.rows[0].data_ultimo_login,
                                "cliente": {
                                    "cpf": result2.rows[0].cpf,
                                    "rg": result2.rows[0].rg,
                                    "cnpj": result2.rows[0].cnpj,
                                    "ie": result2.rows[0].ie,
                                    "id_pessoa": result2.rows[0].id_pessoa
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

sw.get('/listfuncionario', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não conseguiu acessar o DB :" + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query(`SELECT p.nome, p.email, p.telefone, p.cep, 
                                 p.logradouro, p.bairro, p.numero, p.complemento, 
                                 p.observacoes, p.data_cadastro, username, 
                                 p.password, p.data_ultimo_login,
                                 numero_ctps, data_contratacao, data_demissao, perfil
                          FROM pessoas p left join funcionarios f  on (p.nome=f.numero_ctps) order by p.nome asc;`, function (err, result) {
                done(); // closing the connection;
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows);
                }
            });
        }
    });
});
sw.get('/deletefuncionario/:id', function (req, res) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não consequiu acessar o banco de dados!");
        } else {
            var q1 = {
                text: `delete from funcionarios where numero_ctps = $1`,
                values: [req.params.id]
            }
            var q2 = {
                text: `delete FROM pessoas where id = $1`,
                values: [req.params.id]
            }
        }
        client.query(q1, function (err, result) {

            if (err) {
                console.log(err);
                res.status(400).send(`{${err}}`)
            } else {
                client.query(q2, function (err, result) {
                    done(); // closing the connection;
                    if (err) {
                        console.log(err);
                        res.status(400).send(`{${err}}`);
                    } else {
                        res.status(200).send({ 'id': req.params.id }) //retorna o id deletado
                    }
                });
            }
        });
    })
});
sw.post('/insertfuncionario', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: `insert into pessoas (nome, email, telefone, cep, 
                    logradouro, bairro, numero, complemento,observacoes,
                    data_cadastro, username, password, data_ultimo_login)
                       values($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), $10, $11, now())
                       returning nome, email, telefone, cep, 
                              logradouro, bairro, numero, complemento, observacoes, 
                              to_char(data_cadastro, \'dd/mm/yyyy\') as data_cadastro
                              username, password,
                              to_char(data_ultimo_login, \'dd/mm/yyyy\') as data_ultimo_login`,
                values: [
                    req.body.nome,
                    req.body.email,
                    req.body.telefone,
                    req.body.cep,
                    req.body.logradouro,
                    req.body.bairro,
                    req.body.numero,
                    req.body.complemento,
                    req.body.observacoes,
                    req.body.username,
                    req.body.password
                ]
            }
            var q2 = {
                text: `insert into funcionarios (numero_ctps, data_contratacao, data_demissao, perfil)
                       values($1, now(), now())
                       returning numero_ctps,
                                 to_char(data_contratacao, \'dd/mm/yyyy\') as data_contratacao,
                                 to_char(data_demissao, \'dd/mm/yyyy\') as data_demissao`,
                values: [
                    req.body.numero_ctps
                ]
            }
            console.log(q1);

            client.query(q1, function (err, result1) {
                if (err) {
                    console, log('retornou 400 no insert');
                    res.status(400).send(`{${err}}`);
                } else {
                    client.query(q2, function (err, result2) {
                        if (err) {
                            console.log('retornou 400 no insert');
                            res.status(400).send(`{${err}}`);
                        } else {
                            done(); // closing the connection;
                            console.log('retornou 201 no insertfuncionario');
                            res.status(201).send({
                                "id": result1.rows[0].codigo,
                                "nome": result1.rows[0].nome,
                                "email": result1.rows[0].email,
                                "telefone": result1.rows[0].telefone,
                                "cep": result1.rows[0].cep,
                                "logradouro": result1.rows[0].logradouro,
                                "bairro": result1.rows[0].bairro,
                                "numero": result1.rows[0].numero,
                                "complemento": result1.rows[0].complemento,
                                "observacoes": result1.rows[0].observacoes,
                                "data_cadastro": result1.rows[0].data_cadastro,
                                "username": result1.rows[0].username,
                                "password": result1.rows[0].password,
                                "data_ultimo_login": result1.rows[0].data_ultimo_login,
                                "funcionario": {
                                    "numero_ctps": result2.rows[0].numero_ctps
                                }
                            })
                        }
                    })
                }
            })
        }
    })
})

sw.put('/updatefuncionario', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: `update pessoas set nome=$1, email=$2, telefone=$3, cep=$4, 
                logradouro=$5, bairro=$6, numero=$7, complemento=$8, observacoes = $9, 
                username=$10, password=$11
                returning nome, email, telefone, cep, 
                          logradouro, bairro, numero, complemento, observacoes,
                          to_char(data_cadastro, \'dd/mm/yyyy\') as data_cadastro,
                          to_char(data_ultimo_login, \'dd/mm/yyyy\') as data_ultimo_login`,
                values: [
                    req.body.nome,
                    req.body.email,
                    req.body.telefone,
                    req.body.cep,
                    req.body.logradouro,
                    req.body.bairro,
                    req.body.numero,
                    req.complemento,
                    req.observacoes,
                    req.username,
                    req.body.password

                ]
            }
            var q2 = {
                text: `update funcionarios set numero_ctps = $1 
                       returning numero_ctps, 
                                 to_char(data_contratacao, \'dd/mm/yyyy\') as data_contratacao,
                                 to_char(data_demissao, \'dd/mm/yyyy\') as data_demissao`,
                values: [
                    req.body.numero_ctps
                ]
            }
            console.log(q1);
            console.log(q2);

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no update');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    client.query(q2, function (err, result2) {
                        if (err) {
                            console.log(err);
                            console.log('retornou 400 no updatecliente');
                            res.status(400).send(`{${err}}`);
                        } else {

                            done();

                            console.log('retornou 201 no updatecliente');
                            res.status(201).send({
                                "id": result1.rows[0].codigo,
                                "nome": result1.rows[0].nome,
                                "email": result1.rows[0].email,
                                "telefone": result1.rows[0].telefone,
                                "cep": result1.rows[0].cep,
                                "logradouro": result1.rows[0].logradouro,
                                "bairro": result1.rows[0].bairro,
                                "numero": result1.rows[0].numero,
                                "complemento": result1.rows[0].complemento,
                                "observacoes": result1.rows[0].observacoes,
                                "data_cadastro": result1.rows[0].data_cadastro,
                                "username": result1.rows[0].username,
                                "password": result1.rows[0].password,
                                "data_ultimo_login": result1.rows[0].data_ultimo_login,
                                "funcionario": {
                                    "numero_ctps": result2.rows[0].numero_ctps,
                                    "data_contratacao": result2.rows[0].data_contratacao,
                                    "data_demissao": result2.rows[0].data_demissao
                                }
                            })
                        }
                    })


                }
            })
        }

    })
})

sw.get('/listperfil', function (req, res) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query(`select * from perfis as p where id;`, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows)
                }
            });


        }
    });

});

sw.get('/deleteperfil/:id', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados!" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `delete FROM perfis where id = $1`,
                var: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no deleteperfil')
                    res.status(200).send({ "id": result.rows[0].id })
                }
            });
        }
    });
});

sw.post('/insertperfil', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: `insert into perfis (descricao)
                       values($1), 
                       returning descricao`,
                values: [req.body.descricao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no insertperfil');
                    res.status(201).send(result.rows[0])
                }
            });

        }
    });
});
sw.post('/updateperfil', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: `update perfis set descricao=$1, where id =$2`,
                values: [req.body.descricao, req.body.id]
            }
            console.log(q);
        }

        client.query(q, function (err, result) {
            done();
            if (err) {
                console.log("Erro no update perfis: " + err);
                res.status(400).send(`{${err}}`);
            } else {
                res.status(200).send(req.body);
            }
        });
    });
});
sw.get('/listfuncionalidade', function (req, res, next) {
    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query(`select descricao from funcionalidades where id`, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result)
                }
            })

        }
    })
})
sw.get('/deletefuncionalidade:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: 'delete from funcionalidades where id =$1',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(200).send({ "id": req.params.id });
                } else {

                }
            });

        }
    });
});

sw.post('/insertfuncionalidade', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nõa conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: `insert into perfis (descricao)
                       values($1), 
                       returning descricao`,
                values: [req.body.descricao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {

                    console.log('retornou 201 no insertfuncionalidade');
                    res.status(201).send(result.rows[0]);
                }
            });
        }
    });
});

sw.post('/updatefuncionalidade', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Não conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: `update funcionalidade set descricao=$1 where id = $2`,
                values: [req.body.descricao, req.body.id]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {

                    console.log("Erro no update modo: " + err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(req.body);
                }
            });
        }
    });
});

sw.get('/perfil_funcionario', function (req, res) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query(`select p.id, f.id
                          from perfis as p inner join funcionalidades as f
                          on p.id = f.id 
                          order by p.id;`, function (err, result) {
                done();
                if (err) {

                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows);
                }
            });
        }
    });
});

sw.get('/deleteperfil_funcionario/:id', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Não conseguiu acessar o banco de dados!" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `delete from perfil_funcionario`,
                values: [req.params.id]

            }
            client.query(q1, function (err, result) {

                if (err) {

                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no deleteperfil_funcionario');
                    res.status(201).send({ "codigo": result.rows[0].id });
                }
            })

        }
    })
})

sw.post('/insertperfil_funcionario', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: `insert into perfil_funcionario (id_funcionalidade, id_perfil) 
                   returning id_funcionalidade, id_perfil`,
                values: [req.body.id_funcionalidade, req.body.id_perfil]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                } else {
                    console.log('retornou 201 no insertperfil_funcionario');
                    res.status(201).send(result.rows[0]);
                }
            });

        }
    })
});

sw.post('/updateperfil_funcionario', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Não conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: `update perfil_funcionario set id_funcionalidade=$1, id_perfil=$2`,
                values: [req.body.id_funcionalidade, req.id_perfil]
            }
            console.log(id);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log("Erro no update modo: " + err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(req.body);
                }
            });
        }
    });
});

sw.get('/listreserva', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query(`select id, data_inicio, data_fim, valor, valor_entrega,
                                 valor_total, observacoes, cliente, funcionario, status_reserva
                          from Reservas
                          order by id;`, function (err, result) {
                done();
                if (err) {

                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows);
                }
            });
        }
    });
});

sw.get('/deletereserva', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Não conseguiu acessar o banco de dados!" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `delete from Reservas`,
                values: [req.params.id]

            }
            client.query(q1, function (err, result) {

                if (err) {

                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no deleteperfil_funcionario');
                    res.status(201).send({ "id": result.rows[0].id });
                }
            });

        }
    });
});

sw.post('/insertreserva', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: `insert into Reservas (data_inicio, data_fim, valor, valor_entrega, valor_total, observacoes, cliente, funcionario, status_reserva)
                   values(now(), now(),$1, $2, $3, $4, $5, $6, $7) 
                   returning  to_char(data_inicio, \'dd/mm/yyyy\') as data_inicio, to_char(data_fim, \'dd/mm/yyyy\'),
                              valor, valor_entrega, valor_total, observacoes, cliente, funcionario, status_reserva
                  `,
                values: [req.body.data_inicio, req.body.data_fim, req.body.valor,
                req.body.valor_entrega, req.body.valor_total, req.body.observacoes,
                req.body, cliente, req.body.funcionario, req.body.status_reserva]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                } else {
                    console.log('retornou 201 no insertreserva');
                    res.status(201).send(result.rows[0]);
                }
            });

        }
    });
});
sw.post('/updatereserva', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: `update Reservas set (id=$1, valor=$2, valor_entrega=$3, valor_total=$4, observacoes=$5, cliente=$9, funcionario=$10, status_reserva=$11) 
                   returning  to_char(data_inicio, \'dd/mm/yyyy\') as data_inicio, to_char(data_fim, \'dd/mm/yyyy\') as data_fim, 
                              valor, valor_entrega, valor_total, observacoes, cliente, funcionario, status_reserva
                   values(now(), now(),$1, $2, $3, $4, $5, $6, $7)`,
                values: [req.body.data_inicio, req.body.data_fim, req.body.valor,
                req.body.valor_entrega, req.body.valor_total, req.body.observacoes,
                req.body, cliente, req.body.funcionario, req.body.status_reserva]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no update');
                    console.log(err);
                } else {
                    console.log('retornou 201 no updatereserva');
                    res.status(201).send(result.rows[0]);
                }
            });

        }
    });
});

sw.get('/listproduto', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query(`select id, descricao, observacoes, valor_custo, 
            valor_aluguel, valor_venda 
            from Produtos
            order by id asc;`, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows);
                }
            });
        }
    });
});

sw.get('/deleteproduto/:id', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `delete from Produtos where id = $1`,
                values: [req.params.id]
            }

            client.query(q, function (err, result) {
                done(); // closing the connection;
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send({ 'codigo': req.params.codigo });//retorna o nickname deletado.
                }
            });
        }
    });
});

sw.post('/insertproduto', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: `insert into Produtos (descricao, observacoes, valor_custo, valor_aluguel, valor_venda, tipo_produto) 
                values($1, $2, $3, $4, $5, $6)
                returning descricao, observacoes, valor_custo, valor_aluguel, valor_venda, tipo_produto`,
                values: [req.body.descricao,
                req.body.observacoes,
                req.body.valor_custo,
                req.body.valor_aluguel,
                req.body.valor_venda,
                req.body.tipo_produto]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insertproduto');
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    console.log('retornou 201 no insertproduto');
                    res.status(201).send(result.rows[0]);
                }
            });
        }
    });
});

sw.post('updateproduto', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Não conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {

                text: `update Produtos set id=$1, descricao=$2, observacoes=$3, valor_custo=$4, valor_aluguel=$5, valor_venda=$6, tipo_produto=$6`,
                values: [req.body.id, req.body.descricao, req.body.observacoes, req.body.valor_custo, req.body.valor_aluguel, req.body.valor_venda, req.body.tipo_produto]
            }
            console.log(q, function (err, result) {
                done();
                if (err) {
                    console.log("Erro no updateproduto: " + err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(req.body)
                }
            });
        }
    });
});

sw.get('/listfoto', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query(`select id, descricao, b64, 
                          produto_id from Fotos order by id asc;`, function (err, result) {

                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows);
                }

            });
        }
    });
});

sw.get('/deletefoto/:id', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `delete from Fotos where id = $1`,
                values: [req.params.id]
            }

            client.query(q, function (err, result) {
                done(); // closing the connection;
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send({ 'id': req.params.codigo });//retorna o nickname deletado.
                }
            });
        }
    });
})

sw.post('/insertfoto', function (err) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `insert into Fotos (descricao, b64, produto_id) 
                       values($1, $2, $3)
                       returning(descricao, b64, produto_id)`,
                values: [req.body.descricao, req.body.b64, req.body.produto_id]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no insertfoto');
                    res.status(201).send(result.rows[0]);
                }

            });
        }
    });
});

sw.post('/updatefoto', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `update Fotos set descricao=$1, b64=$2, produto_id=$3`,
                values: [req.body.descricao, req.body.b64, req.body.produto_id]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no update ');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no updatefoto');
                    res.status(200).send(req.body);
                }

            });
        }
    });
});

sw.get('/listtipoproduto', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query(`select id, nome  
                          from tiposProduto 
                          order by id asc;`, function (err, result) {
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows);
                }
            });
        }
    });
});

sw.get('/deletetipoproduto/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log(err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `delete from tiposProduto where = $id`,
                values: [req.params.id]
            }
            client.query(q, function (err, client) {
                done(); // closing the connection;
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send({ 'id': req.params.id });//retorna o nickname deletado.
                }

            });
        }
    });
});

sw.post('/inserttipoproduto', function (err) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `insert into tiposProduto (nome) 
                       values($1)
                       returning(nome)`,
                values: [req.body.nome]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no inserttipoproduto');
                    res.status(201).send(result.rows[0]);
                }

            });
        }
    });
});

sw.post('/updatetipoproduto', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `update tiposProduto set nome=$1`,
                values: [req.body.nome]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no update ');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no insertmodo');
                    res.status(200).send(req.body);
                }

            });
        }
    });
});


sw.get('/listlocacao', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {

            client.query(`select id, data_retirada, data_previsao_entrega, data_entrega, 
                              data_previsao_pagamento, valor_total, valor_pago, observacoes, funcionario, tipos_pagamento
                      from locacoes
                      order by id`, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows);
                }
            });

        }
    });

});

sw.get('/deletelocacao/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log(err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `delete from locacoes where = $id`,
                values: [req.params.id]
            }
            client.query(q, function (err, client) {
                done(); // closing the connection;
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send({ 'id': req.params.id });//retorna o nickname deletado.
                }

            });
        }
    });
});

sw.post('/insertlocacao', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `insert into locacoes (data_retirada, data_previsao_entrega, data_entrega, data_previsao_pagamento, valor_total, valor_pago, observacoes, funcionario, tipos_pagamento) 
                       values($1, $2, $3, $4, $5, $6, $7, $8, $9)
                       returning(data_retirada, data_previsao_entrega, data_entrega, data_previsao_pagamento, valor_total, valor_pago, observacoes, funcionario, tipos_pagamento)`,
                values: [req.body.data_retirada, req.body.data_previsao_entrega,
                req.body.data_previsao_pagamento, req.body.valor_total,
                req.body.valor_pago, req.body.funcionario, req.body.tipos_pagamento]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no insertlocacao');
                    res.status(201).send(result.rows[0]);
                }

            });
        }
    });
});

sw.post('/updatelocacao', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `update locacoes set id=$1 data_retirada=$2, 
                       data_previsao_entrega=$3, data_entrega=$4, 
                       data_previsao_pagamento=$5, valor_total=$6, valor_pago=$7, observacoes=$8, funcionario=$9, tipos_pagamento=$10`,
                values: [
                    req.body.id,
                    req.body.data_retirada,
                    req.body.data_previsao_entrega,
                    req.body.data_previsao_pagamento,
                    req.body.valor_total,
                    req.body.valor_pago,
                    req.body.funcionario,
                    req.body.tipos_pagamento]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no update ');
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no updatelocacao');
                    res.status(200).send(req.body);
                }

            });
        }
    });
});

sw.get('/listlocacaoreserva', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {

            client.query(`select id_locacao, id_reserva
                      from locacoes_reservas
                      order by id_locacao, id_reserva`, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows);
                }
            });

        }
    });

});

sw.get('/deletelocacaoreserva/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log(err);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: `delete from locacoes_reservas where = $id`,
                values: [req.params.id]
            }
            var q2 = {
                text: `delete from locacoes_reservas where = $id`,
                values: [req.params.id]
            }

            client.query(q1, function (err, result) {

                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    client.query(q2, function (err, result) {
                        done(); // closing the connection;
                        if (err) {
                            console.log(err);
                            res.status(400).send(`{${err}}`);
                        } else {
                            res.status(200).send({ 'id': req.params.id }) //retorna o id deletado 

                        }
                    })


                }
            })
        }
    });
});

sw.post('/insertlocacaoreserva', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `insert into locacoes_reservas (id_locacao, id_reserva) 
                       values($1, $2)
                       returning(id_locacao, id_reserva)`,
                values: [req.body.id_locacao, req.body.id_reserva]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no insertlocacaoreserva');
                    res.status(201).send(result.rows[0]);
                }

            });
        }
    });
});

sw.post('/updatelocacaoreserva', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `update locacoes_reservas set id_locacao=$1, id_reserva=$2`,
                values: [
                    req.body.id_locacao,
                    req.body.id_reserva]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no update ');
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no updatelocacao');
                    res.status(200).send(req.body);
                }

            });
        }
    });
});

sw.get('/listparcelamento', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {

            client.query(`select id, numero_parcela, data_previsao_pagamento, data_pagamento, valor_total, valot_pago, id_locacao
                      from parcelamentos
                      order by id`, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows);
                }
            });

        }
    });

});

sw.get('/deleteparcelamento/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log(err);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: `delete from parcelamentos where = $id`,
                values: [req.params.id]
            }
            

            client.query(q1, function (err, result) {

                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    res.status(200).send({ 'id': req.params.id })
                }
            })
        }
    });
});

sw.post('/insertparcelamento', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `insert into parcelamentos (numero_parcela, data_previsao_pagamento, data_pagamento, valor_total, valor_pago, id_locacao) 
                       values($1, $2, $3, $4, $5, $6)
                       returning(numero_parcela, data_previsao_pagamento, data_pagamento, valor_total, valor_pago, id_locacao)`,
                values: [req.body.numero_parcela, req.body.data_previsao_pagamento, req.body.data_pagamento, req.body.valor_total, req.body.valor_pago, req.body.id_locacao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no insertparcelamento');
                    res.status(201).send(result.rows[0]);
                }

            });
        }
    });
});

sw.post('/updateparcelamento', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `update locacoes_reservas set id=$1 numero_parcela=$2, data_previsao_pagamento=$3, data_pagamento=$4, valor_total=$5, valor_pago=$6, id_locacao=$7`,
                values: [
                    req.body.id,
                    req.body.numero_parcela, 
                    req.body.data_previsao_pagamento, 
                    req.body.data_pagamento, 
                    req.body.valor_total, 
                    req.body.valor_pago, 
                    req.body.id_locacao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no update ');
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no updateparcelamento');
                    res.status(200).send(req.body);
                }

            });
        }
    });
});

sw.get('/listsitacao', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {

            client.query(`select id, descricao
                      from sitacao
                      order by id`, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows);
                }
            });

        }
    });

});

sw.get('/deletesitacao/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log(err);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: `delete from sitacao where = $id`,
                values: [req.params.id]
            }
            

            client.query(q1, function (err, result) {

                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    res.status(200).send({ 'id': req.params.id })
                }
            })
        }
    });
});

sw.post('/insertsitacao', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `insert into sitacao (descricao) 
                       values($1)
                       returning(descricao)`,
                values: [req.body.descricao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no insertsitacao');
                    res.status(201).send(result.rows[0]);
                }

            });
        }
    });
});

sw.post('/updatesitacao', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `update locacoes_reservas set id=$1 descricao=$2`,
                values: [
                    req.body.id,
                    req.body.descricao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no update ');
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no updatesitacao');
                    res.status(200).send(req.body);
                }

            });
        }
    });
});

sw.get('/listacompanhamento', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {

            client.query(`select id, sequencia_passo, data, observacoes, id_sitacao, id_locacao
                      from acompanhamento
                      order by id`, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows);
                }
            });

        }
    });

});

sw.get('/deletedacompanhamento/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log(err);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: `delete from acompanhamento where = $id`,
                values: [req.params.id]
            }
            

            client.query(q1, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    res.status(200).send({ 'id': req.params.id })
                }
            })
        }
    });
});

sw.post('/insertacompanhamento', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `insert into acompanhamento (sequencia_passo, data, observacoes, id_sitacao, id_locacao) 
                       values($1, $2, $3, $4, $5)
                       returning(sequencia_passo, data, observacoes, id_sitacao, id_locacao)`,
                values: [
                    req.body.sequencia_passo, 
                    req.body.data, 
                    req.body.observacoes, 
                    req.body.id_sitacao, 
                    req.body.id_locacao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no insertacompanhamento');
                    res.status(201).send(result.rows[0]);
                }

            });
        }
    });
});

sw.post('/updateacompanhamento', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `update locacoes_reservas set id=$1, sequencia_passo=$2, data=$3, observacoes=$4, id_sitacao=$5, id_locacao=$6`,
                values: [
                    req.body.id,
                    req.body.sequencia_passo, 
                    req.body.data, 
                    req.body.observacoes, 
                    req.body.id_sitacao, 
                    req.body.id_locacao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no update ');
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no updateacompanhamento');
                    res.status(200).send(req.body);
                }

            });
        }
    });
});


sw.listen(4000, function () {
    console.log('Server is running.. on Port 4000')
})