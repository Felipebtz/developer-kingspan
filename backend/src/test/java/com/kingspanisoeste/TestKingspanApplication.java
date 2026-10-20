package com.kingspanisoeste;

import org.springframework.boot.SpringApplication;

public class TestKingspanApplication {

	public static void main(String[] args) {
		SpringApplication.from(KingspanApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
