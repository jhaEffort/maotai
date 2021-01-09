const fs = require('fs');
const xlsx = require('node-xlsx');
const cheerio = require('cheerio');
const axios = require('axios');


const requestHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36',
    'Referer': 'http://money.163.com/',
};

class Obtain {
    constructor(options) {
        this.url = options.url,
            this.cachePath = './cache.html'
    }
    async start() {
        let html = this.handleWrite()
        if (!html) {
            html = await this.request()
        }
        const filtrationData = this.disposeData(html)
        this.buildXlsx(filtrationData)
    }
    async request() {
        return axios.get(this.url, {
            headers: requestHeaders
        }).then(res => {
            this.handleWrite(res.data)
            return res.data
        })
    }
    disposeData(html) {
        const result = { title: [], profitRateList: [] }
        const $ = cheerio.load(html)
        const $reportTable = $('.table_bg001.border_box.limit_sale.scr_table');
        const titles = $reportTable.find('tbody tr:first-child');
        const tableTitleTds = titles.children();

        const profitRateTr = $reportTable.find('tbody tr:nth-child(12)');
        const profitRateTds = profitRateTr.children();

        for (let i = 0; i < tableTitleTds.length; i++) {
            const titleTd = tableTitleTds[i];
            result.title.push($(titleTd).text().trim());
            const profitRateTd = profitRateTds[i];
            result.profitRateList.push($(profitRateTd).text().trim());
        }
        return result
    }
    buildXlsx(dataObj) {
        const values = Object.values(dataObj);
        const excelBuffer = xlsx.build([{ name: '茅台', data: values }]);
        fs.writeFileSync('exportExcel.xlsx', excelBuffer, 'buffer');
    }
    handleWrite(html) {
        return fs.writeFileSync(this.cachePath, html, 'utf-8')
    }
}
new Obtain({ url: 'http://quotes.money.163.com/f10/zycwzb_600519,report.html' }).start()

