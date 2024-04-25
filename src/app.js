import axios from "axios"
import express from "express"
import puppeteer from "puppeteer"
import * as cheerio from 'cheerio'

const app = express()

app.use(express.json())
app.get('/', async (req, res) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://jurisprudencia.stf.jus.br/pages/search?base=acordaos&pesquisa_inteiro_teor=false&sinonimo=true&plural=true&radicais=false&buscaExata=true&page=1&pageSize=10&queryString=familia&sort=_score&sortBy=desc', { waitUntil: 'networkidle0' })

    const pageContent = await page.evaluate(() => {
        const pageContentList = document.querySelectorAll('p.jud-text');
        const pageContentArray = Array.from(pageContentList);
        return pageContentArray
    });
    await browser.close()
    console.log(pageContent);
    /*for (let i = 0; i < pageContent.length; i++) {
        try {
            await axios.post('http://localhost:3001/adicionar', pageContent[i])
        } catch (error) {
            if (error.response.status === 409) {
                console.log(`Conflito encontrado ao adicionar o item ${i}. Pulando para o próximo.`);
            }
        }

    }*/

    res.send(pageContent)

})

async function main() {
    const URL = 'https://jurisprudencia.stf.jus.br/pages/search'
    const searchFor = `"habeas corpus"`

    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()

    await page.goto(URL)
    console.log('Fui pra URL');

    await page.waitForSelector('#mat-input-0')

    await page.type('#mat-input-0', searchFor)

    await Promise.all([
        page.waitForNavigation(),
        page.click('div mat-icon:nth-child(3)')
    ])

    for (let pages = 0; pages < 100; pages++) {
        await page.waitForSelector('#result-index-0')

        let jurisprudencias = []

        for (let i = 0; i < 4; i++) {
            const el = await page.$(`#result-index-${i}`)
            const jurisprudencia = await page.evaluate(elemento => {

                const jus = {
                    numeroProcesso: elemento.querySelector('a').textContent,
                    nomeRelator: elemento.querySelector('#result-principal-header h4:nth-child(2) > span').textContent,
                    data: elemento.querySelector('#result-principal-header > span h4:nth-child(2) > span').textContent,
                    ementa: elemento.querySelector('p.jud-text.m-0').textContent,
                    emailAssistente: 'ivan.aires@redizz.com.br',
                    link: 'https://jurisprudencia.stf.jus.br/pages/search',
                    tribunal: 'STF',
                    tipo: 'Habeas Corpus',
                    areaDireito: 'Não adicionada'
                }
                return jus
            }, el);

            jurisprudencias.push(jurisprudencia)
        }

        for (let i = 0; i < jurisprudencias.length; i++) {
            try {
                await axios.post('http://localhost:3001/adicionar', jurisprudencias[i])
            } catch (error) {
                console.log(`Conflito encontrado ao adicionar o item ${i}. Pulando para o próximo.`);
            }
        }

        await Promise.all([
            page.waitForNavigation(),
            page.click('i.fa.fa-angle-right')
        ])

    }
}

main()

export default app