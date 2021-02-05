/* Magic Mirror Module: lunar_calendar
 * v1.0 - January 2021
 *
 * By Le Duy <leduy87vnhn@gmail.com>
 * 
 */

Module.register("mmm-lunar_calendar", {

	// Module defaults
	defaults: {
		debugging:		false,
		initialLoadDelay:	0,		// How many seconds to wait on a fresh start up.
							// This is to prevent collision with all other modules also
							// loading all at the same time. This only happens once,
							// when the mirror first starts up.
		fadeSpeed:		2,		// How fast (in seconds) to fade out and in during a midnight refresh
		showHeader:		true,		// Show the month and year at the top of the calendar
		cssStyle:		"block",	// which CSS style to use, 'block', 'slate', or 'custom'
		updateDelay:		5,		// How many seconds after midnight before a refresh
							// This is to prevent collision with other modules refreshing
							// at the same time.
		displayLunar:		"1",
		displaySun:			"1",
		displayLang:		"vn",
	},

	// Required styles
	getStyles: function() {
		return [this.data.path + "/css/mcal.css", this.getThemeCss()];
	},

	getThemeCss: function() {
		return this.data.path + "/css/themes/" + this.config.cssStyle + ".css";
	},

	// Required scripts
	getScripts: function() {
		return ["moment.js"];
	},

	// Override start method
	start: function() {
		Log.log("Starting module: " + this.name);
		// Set locale
		moment.locale(config.language);
		
		// Calculate next midnight and add updateDelay
		var now = moment();
		this.midnight = moment([now.year(), now.month(), now.date() + 1]).add(this.config.updateDelay, "seconds");

		this.loaded = false;

		this.scheduleUpdate(this.config.initialLoadDelay * 1000);
	},

	// Override dom generator
	getDom: function() {

		if ((moment() > this.midnight) || (!this.loaded)) {

			var month = moment().month();
			var year = moment().year();
			var monthName = moment().format("MMMM");
			var monthLength = moment().daysInMonth();

			// Find first day of the month, LOCALE aware
			var startingDay = moment().date(1).weekday();

			if (this.config.displaySun == 1) {
				
				var wrapper = document.createElement("table");
				wrapper.className = 'xsmall';
				wrapper.id = 'calendar-table';
				this.displayCalendar(wrapper, 0, month, year, monthName, monthLength, startingDay);
				this.loaded = true;
			}
			
//			if (this.config.displayLunar == 1) {
//				var wrapper = document.createElement("table");
//				wrapper.className = 'xsmall';
//				wrapper.id = 'calendar-table';
//				this.displayCalendar(wrapper, 1, month, year, monthName, monthLength, startingDay);
//			}
			return wrapper;
		}

	},
	
	displayCalendar: function(wrapper, calendarType, month, year, monthName, monthLength, startingDay) {

		// Create THEAD section with month name and 4-digit year
		var header = document.createElement("tHead");
		var headerTR = document.createElement("tr");
		
		var lunarDate = [0, 0, 0, 0];
		if (calendarType == 1) {
			lunarDate = this.convertSolar2Lunar(moment().date(), month, year, 7);	
		}

		// We only fill in the THEAD section if the .showHeader config is set to true
		if (this.config.showHeader) {
			var headerTH = document.createElement("th");
			headerTH.colSpan = "7";
			headerTH.scope = "col";
			headerTH.id = "calendar-th";
			var headerMonthSpan = document.createElement("span");
			headerMonthSpan.id = "monthName";
			headerMonthSpan.innerHTML = monthName;
			var headerYearSpan = document.createElement("span");
			headerYearSpan.id = "yearDigits";
			if (calendarType == 1) { // Lunar calendar
				headerYearSpan.innerHTML = year + " (" + this.calculateYearCan(lunarDate[2]) + " " + this.calculateYearChi(lunarDate[2]) + ") ";
			} else {				
				headerYearSpan.innerHTML = year;
			}
			// Add space between the two elements
			// This can be used later with the :before or :after options in the CSS
			var headerSpace = document.createTextNode(" ");

			headerTH.appendChild(headerMonthSpan);
			headerTH.appendChild(headerSpace);
			headerTH.appendChild(headerYearSpan);
			headerTR.appendChild(headerTH);
		}
		header.appendChild(headerTR);
		wrapper.appendChild(header);

		// Create TFOOT section -- currently used for debugging only
		var footer = document.createElement('tFoot');
		var footerTR = document.createElement("tr");
		footerTR.id = "calendar-tf";

		var footerTD = document.createElement("td");
		footerTD.colSpan ="7";
		footerTD.className = "footer";
		if (this.config.debugging) {
			footerTD.innerHTML = "Calendar currently in DEBUG mode!<br />Please see console log.";
		} else {
			if (calendarType == 1) {
				jd = this.jdFromDate(moment().date(), month, year);
				var dateCan = this.calculateDateCan(jd);
				var dateChi = this.calculateDateChi(jd);
				var monthCan = this.calculateMonthCan(lunarDate[1], lunarDate[2]);
				var monthChi = this.calculateMonthChi(lunarDate[1]);
				
				if (lunarDate[3] == 1) {
					monthChi = monthChi + " (Nhuận)";
				}
				footerTD.innerHTML = "Ngày " + dateCan + " " + dateChi + " - Tháng " + monthCan + " " + monthChi;
			} else {
				footerTD.innerHTML = "&nbsp;";
			}
		}

		footerTR.appendChild(footerTD);
		footer.appendChild(footerTR);
		wrapper.appendChild(footer);

		// Create TBODY section with day names
		var bodyContent = document.createElement("tBody");
		var bodyTR = document.createElement("tr");
		bodyTR.id = "calendar-header";

		for (var i = 0; i <= 6; i++ ){
			var bodyTD = document.createElement("td");
			bodyTD.className = "calendar-header-day";
			bodyTD.innerHTML = moment().weekday(i).format("ddd");
			bodyTR.appendChild(bodyTD);
		}
		bodyContent.appendChild(bodyTR);
		wrapper.appendChild(bodyContent);

		// Create TBODY section with the calendar
		var bodyContent = document.createElement("tBody");
		var bodyTR = document.createElement("tr");
		bodyTR.className = "weekRow";

		// Fill in the days
		var day = 1;
		var nextMonth = 1;
		// Loop for amount of weeks (as rows)
		for (var i = 0; i < 9; i++) {
			// Loop for each weekday (as individual cells)
			for (var j = 0; j <= 6; j++) {
				var bodyTD = document.createElement("td");
				bodyTD.className = "calendar-day";
				var squareDiv = document.createElement("div");
				squareDiv.className = "square-box";
				var squareContent = document.createElement("div");
				squareContent.className = "square-content";
				var squareContentInner = document.createElement("div");
				var innerSpan = document.createElement("span");
			
				if (j < startingDay && i == 0) {
					// First row, fill in empty slots
					innerSpan.className = "monthPrev";
					innerSpan.innerHTML = moment().subtract(1, 'months').endOf('month').subtract((startingDay - 1) - j, 'days').date();

				} else if (day <= monthLength && (i > 0 || j >= startingDay)) {
					if (day == moment().date()) {
						innerSpan.id = "day" + day;
						innerSpan.className = "today";
					} else {
						innerSpan.id = "day" + day;
						innerSpan.className = "daily";
					}
					if (calendarType == 1) {
						lunarDate = this.convertSolar2Lunar(day, month, year, 7);
						if (lunarDate[0] == 1) {
							innerSpan.innerHTML = lunarDate[0] + "/" + lunarDate[1];
						} else {
							innerSpan.innerHTML = lunarDate[0];
						}
					} else {
						innerSpan.innerHTML = day;
					}
					day++;
				} else if (day > monthLength && i > 0) {
					// Last row, fill in empty space
					innerSpan.className = "monthNext";
					innerSpan.innerHTML = moment([year, month, monthLength]).add(nextMonth, 'days').date();
					nextMonth++;
				}
				squareContentInner.appendChild(innerSpan);
				squareContent.appendChild(squareContentInner);
				squareDiv.appendChild(squareContent);
				bodyTD.appendChild(squareDiv);	
				bodyTR.appendChild(bodyTD);

			}
			// Don't need any more rows if we've run out of days
			if (day > monthLength) {
				break;
			} else {
				bodyTR.appendChild(bodyTD);
				bodyContent.appendChild(bodyTR);
				var bodyTR = document.createElement("tr");
				bodyTR.className = "weekRow";
			}
		}	

		bodyContent.appendChild(bodyTR);
		wrapper.appendChild(bodyContent);

	},
	
	jdFromDate: function(dd, mm, yy) {
		var a, y, m, jd;
		a = Math.floor((14 - mm) / 12);
		y = yy+4800-a;
		m = mm+12*a-3;
		jd = dd + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
		if (jd < 2299161) {
			jd = dd + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - 32083;
		}
		return jd;
	},
	
	getNewMoonDay: function(k, timeZone) {

		var T, T2, T3, dr, Jd1, M, Mpr, F, C1, deltat, JdNew, PI;
		PI = 3.141592653589793238;
		T = k/1236.85; // Time in Julian centuries from 1900 January 0.5
		T2 = T * T;
		T3 = T2 * T;
		dr = PI/180;
		Jd1 = 2415020.75933 + 29.53058868*k + 0.0001178*T2 - 0.000000155*T3;
		Jd1 = Jd1 + 0.00033*Math.sin((166.56 + 132.87*T - 0.009173*T2)*dr); // Mean new moon
		M = 359.2242 + 29.10535608*k - 0.0000333*T2 - 0.00000347*T3; // Sun's mean anomaly
		Mpr = 306.0253 + 385.81691806*k + 0.0107306*T2 + 0.00001236*T3; // Moon's mean anomaly
		F = 21.2964 + 390.67050646*k - 0.0016528*T2 - 0.00000239*T3; // Moon's argument of latitude
		C1=(0.1734 - 0.000393*T)*Math.sin(M*dr) + 0.0021*Math.sin(2*dr*M);
		C1 = C1 - 0.4068*Math.sin(Mpr*dr) + 0.0161*Math.sin(dr*2*Mpr);
		C1 = C1 - 0.0004*Math.sin(dr*3*Mpr);
		C1 = C1 + 0.0104*Math.sin(dr*2*F) - 0.0051*Math.sin(dr*(M+Mpr));
		C1 = C1 - 0.0074*Math.sin(dr*(M-Mpr)) + 0.0004*Math.sin(dr*(2*F+M));
		C1 = C1 - 0.0004*Math.sin(dr*(2*F-M)) - 0.0006*Math.sin(dr*(2*F+Mpr));
		C1 = C1 + 0.0010*Math.sin(dr*(2*F-Mpr)) + 0.0005*Math.sin(dr*(2*Mpr+M));
		if (T < -11) {
			deltat= 0.001 + 0.000839*T + 0.0002261*T2 - 0.00000845*T3 - 0.000000081*T*T3;
		} else {
			deltat= -0.000278 + 0.000265*T + 0.000262*T2;
		};
		JdNew = Jd1 + C1 - deltat;
		return Math.floor(JdNew + 0.5 + timeZone/24)
	},
	
	getSunLongitude: function(jdn, timeZone) {

		var T, T2, dr, M, L0, DL, L, PI;
		PI = 3.141592653589793238;
		T = (jdn - 2451545.5 - timeZone/24) / 36525; // Time in Julian centuries from 2000-01-01 12:00:00 GMT
		T2 = T*T;
		dr = PI/180; // degree to radian
		M = 357.52910 + 35999.05030*T - 0.0001559*T2 - 0.00000048*T*T2; // mean anomaly, degree
		L0 = 280.46645 + 36000.76983*T + 0.0003032*T2; // mean longitude, degree
		DL = (1.914600 - 0.004817*T - 0.000014*T2)*Math.sin(dr*M);
		DL = DL + (0.019993 - 0.000101*T)*Math.sin(dr*2*M) + 0.000290*Math.sin(dr*3*M);
		L = L0 + DL; // true longitude, degree
		L = L*dr;
		L = L - PI*2*(Math.floor(L/(PI*2))); // Normalize to (0, 2*PI)
		return Math.floor(L / PI * 6);
	},
	
	getLunarMonth11: function(yy, timeZone) {

		var k, off, nm, sunLong;
		off = this.jdFromDate(31, 12, yy) - 2415021;
		k = Math.floor(off / 29.530588853);
		nm = this.getNewMoonDay(k, timeZone);
		sunLong = this.getSunLongitude(nm, timeZone); // sun longitude at local midnight
		if (sunLong >= 9) {
			nm = this.getNewMoonDay(k-1, timeZone);
		}
		return nm;
	},
	
	getLeapMonthOffset: function(a11, timeZone) {

		var k, last, arc, i;
		k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
		last = 0;
		i = 1; // We start with the month following lunar month 11
		arc = this.getSunLongitude(this.getNewMoonDay(k+i, timeZone), timeZone);
		do {
			last = arc;
			i++;
			arc = this.getSunLongitude(this.getNewMoonDay(k+i, timeZone), timeZone);
		} while (arc != last && i < 14);
		return i-1;
	},
	
	convertSolar2Lunar: function(dd, mm, yy, timeZone) {

		var k, dayNumber, monthStart, a11, b11, lunarDay, lunarMonth, lunarYear, lunarLeap;
		lunarDay = 0;
		lunarMonth = 3;
		lunarYear = 2021;
		lunarLeap = 0;
		dayNumber = this.jdFromDate(dd, mm, yy);

		k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
		
		monthStart = this.getNewMoonDay(k+1, timeZone);
		if (monthStart > dayNumber) {
			monthStart = this.getNewMoonDay(k, timeZone);
		}
		
		a11 = this.getLunarMonth11(yy, timeZone);
		b11 = a11;
		if (a11 >= monthStart) {
			lunarYear = yy;
			a11 = this.getLunarMonth11(yy-1, timeZone);
		} else {
			lunarYear = yy+1;
			b11 = this.getLunarMonth11(yy+1, timeZone);
		}
		lunarDay = dayNumber-monthStart+1;
		diff = Math.floor((monthStart - a11)/29);
		lunarLeap = 0;
		lunarMonth = diff+11;
		if (b11 - a11 > 365) {
			leapMonthDiff = this.getLeapMonthOffset(a11, timeZone);
			if (diff >= leapMonthDiff) {
				lunarMonth = diff + 10;
				if (diff == leapMonthDiff) {
					lunarLeap = 1;
				}
			}
		}
		if (lunarMonth > 12) {
			lunarMonth = lunarMonth - 12;
		}
		if (lunarMonth >= 11 && diff < 4) {
			lunarYear -= 1;
		}

		return new Array(lunarDay, lunarMonth, lunarYear, lunarLeap);

	},
	
	calculateYearCan: function(lunarYear) {
		var canList = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
		var yearIndex = (lunarYear + 6) % 10;
		return canList[yearIndex];
	},
	
	calculateYearChi: function(lunarYear) {
		var chiList = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
		var yearIndex = (lunarYear + 8) % 12;
		return chiList[yearIndex];
	},
	
	calculateDateCan: function(jDate) {
		var canList = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
		var dateIndex = (jDate + 9) % 10;
		return canList[dateIndex];
	},
	
	calculateDateChi: function(jDate) {
		var chiList = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
		var dateIndex = (jDate + 1) % 12;
		return chiList[dateIndex];
	},
	
	calculateMonthCan: function(mm, yy) {
		var canList = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
		var monthIndex = (yy * 12 + mm + 3) % 10;
		return canList[monthIndex];
	},
	
	calculateMonthChi: function(mm) {
		var chiList = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
		var monthIndex = mm - 1;
		return chiList[monthIndex];
	},
	
	scheduleUpdate: function(delay) {
		if (this.config.debugging) {
			Log.log("= = = = = = = = = = = = = = = = = = = = = = = = = = = = = =");
			Log.log("CALENDAR_MONTHLY IS IN DEBUG MODE!");
			Log.log("Remove 'debugging' option from config/config.js to disable.");
			Log.log("             Current moment(): " + moment() + " (" + moment().format("hh:mm:ss a") + ")");
			Log.log("scheduleUpdate() delay set at: " + delay);
		}

		if (typeof delay !== "undefined" && delay >= 0) {
			nextReload = delay;
		}

		if (delay > 0) {
			// Calculate the time DIFFERENCE to that next reload!
			nextReload = moment.duration(nextReload.diff(moment(), "milliseconds"));
			if (this.config.debugging) {
				var hours = Math.floor(nextReload.asHours());
				var  mins = Math.floor(nextReload.asMinutes()) - hours * 60;
				var  secs = Math.floor(nextReload.asSeconds()) - ((hours * 3600 ) + (mins * 60));
				Log.log("  nextReload should happen at: " + delay + " (" + moment(delay).format("hh:mm:ss a") + ")");
				Log.log("                  which is in: " + mins + " minutes and " + secs + " seconds.");
				Log.log("              midnight set at: " + this.midnight + " (" + moment(this.midnight).format("hh:mm:ss a") + ")");
				Log.log("= = = = = = = = = = = = = = = = = = = = = = = = = = = = = =");
			}
		}

		var self = this;
		setTimeout(function() {
			self.reloadDom();
		}, nextReload);

	},

	reloadDom: function() {
		if (this.config.debugging) {
			Log.log("          Calling reloadDom()!");
		}

		var now = moment();
		if (now > this.midnight) {
			this.updateDom(this.config.fadeSpeed * 1000);
			this.midnight = moment([now.year(), now.month(), now.date() + 1]).add(this.config.updateDelay, "seconds");
		}

		var nextRefresh = moment([now.year(), now.month(), now.date(), now.hour() + 1]);
		this.scheduleUpdate(nextRefresh);
	}

});
