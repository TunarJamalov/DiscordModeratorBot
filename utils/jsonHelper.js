const fs = require("fs");
const path = require("path");

class JsonHelper {
    constructor(filename) {
        this.filePath = path.join(__dirname, "../data", filename);
        this.ensureDirectoryExists();
    }

    ensureDirectoryExists() {
        const dataDir = path.dirname(this.filePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    read() {
        if (!fs.existsSync(this.filePath)) {
            return {};
        }
        
        try {
            const data = fs.readFileSync(this.filePath, "utf-8");
            return JSON.parse(data);
        } catch (error) {
            console.error(`JSON dosyası okuma hatası (${this.filePath}):`, error);
            return {};
        }
    }

    write(data) {
        try {
            this.ensureDirectoryExists();
            fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
            return true;
        } catch (error) {
            console.error(`JSON dosyası yazma hatası (${this.filePath}):`, error);
            return false;
        }
    }


    incrementRegister(userID, gender) {
        const data = this.read();
        
        
        if (!data[userID]) {
            data[userID] = {
                total: 0,
                male: 0,
                female: 0
            };
        }
        
      
        data[userID].total++;
        
     
        if (gender === "male") {
            data[userID].male++;
        } else if (gender === "female") {
            data[userID].female++;
        }
        
       
        return this.write(data);
    }

   
    getSortedEntries(sortBy = "total", descending = true) {
        const data = this.read();
        return Object.entries(data)
            .sort((a, b) => {
                const valueA = a[1][sortBy];
                const valueB = b[1][sortBy];
                return descending ? valueB - valueA : valueA - valueB;
            });
    }
}

module.exports = JsonHelper;